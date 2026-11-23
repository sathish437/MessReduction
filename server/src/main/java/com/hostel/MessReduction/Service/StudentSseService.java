package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ResDTO.RequestTrackingResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentTrackingEventDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
public class StudentSseService {

    // 30-minute connection timeout; heartbeat keeps active sockets alive
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L;
    private static final int MAX_CACHE_SIZE = 200;

    // Active emitters keyed by authenticated studentId
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> studentEmitters = new ConcurrentHashMap<>();

    // In-memory cache of recent events for Last-Event-ID reconnection recovery
    private final ConcurrentLinkedDeque<CachedStudentEvent> recentEvents = new ConcurrentLinkedDeque<>();

    private final AtomicInteger activeConnectionCount = new AtomicInteger(0);
    private final AtomicLong eventSequence = new AtomicLong(System.currentTimeMillis());

    private record CachedStudentEvent(
            String eventId,
            Long studentId,
            Long formId,
            StudentTrackingEventDTO payload,
            long timestamp
    ) {}

    /**
     * Establish a new SSE connection for an authenticated student.
     */
    public SseEmitter createConnection(Long studentId, String lastEventId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        activeConnectionCount.incrementAndGet();

        studentEmitters.computeIfAbsent(studentId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> removeEmitter(studentId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(() -> {
            log.debug("Student SSE connection timeout for studentId: {}", studentId);
            emitter.complete();
            cleanup.run();
        });
        emitter.onError(ex -> {
            log.debug("Student SSE connection error for studentId {}: {}", studentId, ex.getMessage());
            cleanup.run();
        });

        // Send initial connect handshake
        try {
            Map<String, Object> handshake = new HashMap<>();
            handshake.put("status", "connected");
            handshake.put("studentId", studentId);
            handshake.put("timestamp", System.currentTimeMillis());

            emitter.send(SseEmitter.event()
                    .name("connect")
                    .id("init-" + System.currentTimeMillis())
                    .reconnectTime(5000L)
                    .data(handshake));

            log.info("Student SSE client connected: studentId={} | total student connections={}",
                    studentId, activeConnectionCount.get());

            // Replay missed events if client supplied Last-Event-ID
            if (lastEventId != null && !lastEventId.trim().isEmpty()) {
                replayMissedEvents(emitter, studentId, lastEventId.trim());
            }

        } catch (IOException e) {
            log.warn("Failed to send initial SSE handshake to student {}: {}", studentId, e.getMessage());
            cleanup.run();
        }

        return emitter;
    }

    private void removeEmitter(Long studentId, SseEmitter emitter) {
        if (studentId == null || emitter == null) return;
        CopyOnWriteArrayList<SseEmitter> emitters = studentEmitters.get(studentId);
        if (emitters != null) {
            if (emitters.remove(emitter)) {
                activeConnectionCount.decrementAndGet();
            }
            if (emitters.isEmpty()) {
                studentEmitters.remove(studentId);
            }
        }
    }

    private void replayMissedEvents(SseEmitter emitter, Long studentId, String lastEventId) {
        try {
            for (CachedStudentEvent event : recentEvents) {
                if (studentId.equals(event.studentId())) {
                    if (event.eventId().compareTo(lastEventId) > 0) {
                        emitter.send(SseEmitter.event()
                                .name("track-update")
                                .id(event.eventId())
                                .reconnectTime(5000L)
                                .data(event.payload()));
                        log.debug("Replayed missed event {} to student {}", event.eventId(), studentId);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Unable to replay missed events for Last-Event-ID {}: {}", lastEventId, e.getMessage());
        }
    }

    /**
     * Heartbeat scheduler fires every 25 seconds to keep connections alive and detect dead connections.
     */
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (activeConnectionCount.get() == 0) return;

        List<Map.Entry<Long, SseEmitter>> deadEmitters = new ArrayList<>();

        studentEmitters.forEach((studentId, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("heartbeat")
                            .id("hb-" + System.currentTimeMillis())
                            .data("ping"));
                } catch (Exception ex) {
                    deadEmitters.add(Map.entry(studentId, emitter));
                }
            }
        });

        for (Map.Entry<Long, SseEmitter> entry : deadEmitters) {
            removeEmitter(entry.getKey(), entry.getValue());
        }
    }

    /**
     * Send real-time tracking update event to the student who owns this application.
     * Called strictly after transaction commit.
     */
    public void sendTrackingUpdate(Long studentId, Long formId, RequestTrackingResDTO tracking, String message) {
        if (studentId == null || formId == null) {
            log.warn("Cannot send student SSE update: missing studentId or formId");
            return;
        }

        String eventId = String.valueOf(eventSequence.incrementAndGet());
        StudentTrackingEventDTO payload = StudentTrackingEventDTO.builder()
                .formId(formId)
                .studentId(studentId)
                .currentStage(tracking != null ? tracking.getCurrentStage() : "SUBMITTED")
                .currentStatus(tracking != null ? tracking.getCurrentStatus() : null)
                .message(message != null ? message : "Application status updated")
                .timestamp(LocalDateTime.now())
                .tracking(tracking)
                .build();

        // Cache for replay
        recentEvents.addLast(new CachedStudentEvent(eventId, studentId, formId, payload, System.currentTimeMillis()));
        while (recentEvents.size() > MAX_CACHE_SIZE) {
            recentEvents.pollFirst();
        }

        List<SseEmitter> emitters = studentEmitters.get(studentId);
        if (emitters == null || emitters.isEmpty()) {
            log.debug("Student {} is currently offline. Tracking update for form {} cached.", studentId, formId);
            return;
        }

        List<SseEmitter> failedEmitters = new ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("track-update")
                        .id(eventId)
                        .reconnectTime(5000L)
                        .data(payload));
                log.info("[Student SSE Sent] To studentId: {} | FormId: {} | Stage: {} | Status: {}",
                        studentId, formId, payload.getCurrentStage(), payload.getCurrentStatus());
            } catch (Exception ex) {
                log.warn("Failed to deliver student SSE update to emitter: {}", ex.getMessage());
                failedEmitters.add(emitter);
            }
        }

        for (SseEmitter dead : failedEmitters) {
            removeEmitter(studentId, dead);
        }
    }

    public int getActiveConnectionCount() {
        return activeConnectionCount.get();
    }

    public int getEmitterCountForStudent(Long studentId) {
        List<SseEmitter> list = studentEmitters.get(studentId);
        return list == null ? 0 : list.size();
    }
}
