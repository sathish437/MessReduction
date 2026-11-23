package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ResDTO.NotificationEventDTO;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
public class SseNotificationService {

    // 30 minutes connection timeout. Heartbeat keeps connections active.
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L;
    private static final int MAX_CACHE_SIZE = 100;

    private final StaffUsersRepo staffUsersRepo;

    // Active emitters keyed by Deputy Warden username (e.g. "deputyWarden4")
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    // Active emitters keyed by Deputy Warden userId string (e.g. "4") for dual-lookup support
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> idEmitters = new ConcurrentHashMap<>();

    // In-memory cache of recent events for Last-Event-ID recovery
    private final ConcurrentLinkedDeque<CachedEvent> recentEvents = new ConcurrentLinkedDeque<>();

    private final AtomicInteger activeConnectionCount = new AtomicInteger(0);

    public SseNotificationService(StaffUsersRepo staffUsersRepo) {
        this.staffUsersRepo = staffUsersRepo;
    }

    private record CachedEvent(
            String eventId,
            String targetUsername,
            Long targetUserId,
            NotificationEventDTO payload,
            long timestamp
    ) {}

    /**
     * Establish and register a new SSE connection for an authenticated Deputy Warden.
     */
    public SseEmitter createConnection(Long userId, String username, String lastEventId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        activeConnectionCount.incrementAndGet();

        // Register under username
        if (username != null && !username.trim().isEmpty()) {
            userEmitters.computeIfAbsent(username, k -> new CopyOnWriteArrayList<>()).add(emitter);
        }

        // Register under userId
        if (userId != null) {
            String idKey = userId.toString();
            idEmitters.computeIfAbsent(idKey, k -> new CopyOnWriteArrayList<>()).add(emitter);
        }

        // Setup cleanup hooks
        Runnable cleanup = () -> removeEmitter(userId, username, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(() -> {
            log.debug("SSE connection timeout for user: {} (id: {})", username, userId);
            emitter.complete();
            cleanup.run();
        });
        emitter.onError(ex -> {
            log.debug("SSE connection error for user: {} (id: {}): {}", username, userId, ex.getMessage());
            cleanup.run();
        });

        // Send initial connect handshake with reconnectTime
        try {
            Map<String, Object> handshakeData = new HashMap<>();
            handshakeData.put("status", "connected");
            handshakeData.put("username", username);
            handshakeData.put("userId", userId);
            handshakeData.put("timestamp", System.currentTimeMillis());

            emitter.send(SseEmitter.event()
                    .name("connect")
                    .id("0")
                    .reconnectTime(5000L)
                    .data(handshakeData));

            log.info("SSE client connected: user={} (id={}) | total active connections={}",
                    username, userId, activeConnectionCount.get());

            // Replay missed events if Last-Event-ID was supplied
            if (lastEventId != null && !lastEventId.trim().isEmpty()) {
                replayMissedEvents(emitter, userId, username, lastEventId.trim());
            }

        } catch (IOException e) {
            log.warn("Failed to send initial SSE handshake to user {}: {}", username, e.getMessage());
            cleanup.run();
        }

        return emitter;
    }

    /**
     * Replay any cached events that were published after the client's last received event ID.
     */
    private void replayMissedEvents(SseEmitter emitter, Long userId, String username, String lastEventId) {
        try {
            long lastId = Long.parseLong(lastEventId);
            for (CachedEvent event : recentEvents) {
                try {
                    long eventIdNum = Long.parseLong(event.eventId());
                    if (eventIdNum > lastId) {
                        boolean matchUser = (username != null && username.equalsIgnoreCase(event.targetUsername()))
                                || (userId != null && userId.equals(event.targetUserId()));
                        if (matchUser) {
                            emitter.send(SseEmitter.event()
                                    .name("new-request")
                                    .id(event.eventId())
                                    .data(event.payload()));
                            log.debug("Replayed event {} to user {}", event.eventId(), username);
                        }
                    }
                } catch (NumberFormatException ignored) {}
            }
        } catch (Exception e) {
            log.debug("Unable to replay missed events for Last-Event-ID {}: {}", lastEventId, e.getMessage());
        }
    }

    /**
     * Heartbeat scheduler to keep active SSE connections alive and detect dead connections.
     * Fires every 25 seconds.
     */
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (activeConnectionCount.get() == 0) return;

        Set<SseEmitter> deadEmitters = new HashSet<>();

        userEmitters.forEach((username, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("heartbeat")
                            .id("hb-" + System.currentTimeMillis())
                            .data("ping"));
                } catch (Exception ex) {
                    deadEmitters.add(emitter);
                }
            }
        });

        if (!deadEmitters.isEmpty()) {
            deadEmitters.forEach(emitter -> removeEmitter(null, null, emitter));
            log.debug("Cleaned up {} dead SSE connections during heartbeat", deadEmitters.size());
        }
    }

    /**
     * Publish a new student Mess Reduction application event to the assigned Deputy Warden.
     * Called strictly after database commit.
     */
    public void sendNewApplicationNotification(
            Long applicationId,
            String studentName,
            String registerNumber,
            String department,
            Integer yearOfStudy,
            String assignedDeputyWarden) {

        if (applicationId == null || assignedDeputyWarden == null) {
            log.warn("Cannot send SSE notification: missing applicationId or assignedDeputyWarden");
            return;
        }

        // Construct minimal payload
        NotificationEventDTO payload = NotificationEventDTO.builder()
                .applicationId(applicationId)
                .studentName(studentName)
                .registerNumber(registerNumber)
                .department(department)
                .yearOfStudy(yearOfStudy)
                .build();

        // Resolve userId of target Deputy Warden for dual-key lookup
        Long targetUserId = null;
        try {
            Optional<StaffUsers> staffOpt = staffUsersRepo.findByUserName(assignedDeputyWarden);
            if (staffOpt.isPresent()) {
                targetUserId = staffOpt.get().getUserId();
            }
        } catch (Exception e) {
            log.debug("Could not resolve userId for deputy warden {}: {}", assignedDeputyWarden, e.getMessage());
        }

        // Cache the event for Last-Event-ID reconnection recovery
        cacheEvent(applicationId.toString(), assignedDeputyWarden, targetUserId, payload);

        // Gather unique active emitters for this Deputy Warden and Warden
        Set<SseEmitter> targetEmitters = new HashSet<>();
        List<SseEmitter> byUser = userEmitters.get(assignedDeputyWarden);
        if (byUser != null) targetEmitters.addAll(byUser);

        if (targetUserId != null) {
            List<SseEmitter> byId = idEmitters.get(targetUserId.toString());
            if (byId != null) targetEmitters.addAll(byId);
        }

        // Also notify connected Warden for this submission
        List<SseEmitter> byWarden = userEmitters.get("warden");
        if (byWarden != null) targetEmitters.addAll(byWarden);
        if (yearOfStudy != null) {
            List<SseEmitter> byYearWarden = userEmitters.get("warden" + yearOfStudy);
            if (byYearWarden != null) targetEmitters.addAll(byYearWarden);
        }

        if (targetEmitters.isEmpty()) {
            log.info("[SSE Notification] Deputy Warden '{}' is currently offline. Event {} cached for reconnection.",
                    assignedDeputyWarden, applicationId);
            return;
        }

        List<SseEmitter> failedEmitters = new ArrayList<>();

        for (SseEmitter emitter : targetEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("new-request")
                        .id(applicationId.toString())
                        .data(payload));
                log.info("[SSE Notification Sent] To Deputy Warden '{}' | AppId: {} | Student: {} | Dept: {}",
                        assignedDeputyWarden, applicationId, studentName, department);
            } catch (Exception ex) {
                log.warn("Failed to deliver SSE event {} to emitter: {}", applicationId, ex.getMessage());
                failedEmitters.add(emitter);
            }
        }

        // Remove any failed emitters immediately
        for (SseEmitter dead : failedEmitters) {
            removeEmitter(targetUserId, assignedDeputyWarden, dead);
        }
    }

    private void cacheEvent(String eventId, String targetUsername, Long targetUserId, NotificationEventDTO payload) {
        recentEvents.addLast(new CachedEvent(eventId, targetUsername, targetUserId, payload, System.currentTimeMillis()));
        while (recentEvents.size() > MAX_CACHE_SIZE) {
            recentEvents.pollFirst();
        }
    }

    /**
     * Safely remove an emitter from all tracking structures to avoid memory leaks.
     */
    private void removeEmitter(Long userId, String username, SseEmitter emitter) {
        boolean removed = false;

        if (username != null) {
            CopyOnWriteArrayList<SseEmitter> list = userEmitters.get(username);
            if (list != null) {
                removed = list.remove(emitter) || removed;
                if (list.isEmpty()) {
                    userEmitters.remove(username);
                }
            }
        }

        if (userId != null) {
            String idKey = userId.toString();
            CopyOnWriteArrayList<SseEmitter> list = idEmitters.get(idKey);
            if (list != null) {
                removed = list.remove(emitter) || removed;
                if (list.isEmpty()) {
                    idEmitters.remove(idKey);
                }
            }
        }

        // If username or userId were null (e.g. heartbeat sweep), sweep all maps
        if (username == null && userId == null) {
            for (Map.Entry<String, CopyOnWriteArrayList<SseEmitter>> entry : userEmitters.entrySet()) {
                if (entry.getValue().remove(emitter)) {
                    removed = true;
                    if (entry.getValue().isEmpty()) {
                        userEmitters.remove(entry.getKey());
                    }
                }
            }
            for (Map.Entry<String, CopyOnWriteArrayList<SseEmitter>> entry : idEmitters.entrySet()) {
                if (entry.getValue().remove(emitter)) {
                    removed = true;
                    if (entry.getValue().isEmpty()) {
                        idEmitters.remove(entry.getKey());
                    }
                }
            }
        }

        if (removed) {
            activeConnectionCount.decrementAndGet();
            log.debug("SSE emitter removed for user {} (id {}). Remaining active connections: {}",
                    username, userId, activeConnectionCount.get());
        }
    }

    public int getActiveConnectionCount() {
        return activeConnectionCount.get();
    }
}
