package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.PushSubscription;
import com.hostel.MessReduction.Entity.SubscriptionDetail;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.PushSubscriptionRepository;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import jakarta.annotation.PostConstruct;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Security;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;

import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;

@Service
@Transactional
public class PushNotificationService {
    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Value("${webpush.public-key}")
    private String publicKey;

    @Value("${webpush.private-key}")
    private String privateKey;

    @Value("${webpush.subject}")
    private String subject;

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final StudentDetailsRepo studentDetailsRepo;
    private final ReductionFormRepo reductionFormRepo;
    private final StaffUsersRepo staffUsersRepo;
    private PushService pushService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PushNotificationService(PushSubscriptionRepository pushSubscriptionRepository,
                                   StudentDetailsRepo studentDetailsRepo,
                                   ReductionFormRepo reductionFormRepo,
                                   StaffUsersRepo staffUsersRepo) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.studentDetailsRepo = studentDetailsRepo;
        this.reductionFormRepo = reductionFormRepo;
        this.staffUsersRepo = staffUsersRepo;
    }

    @PostConstruct
    public void init() {
        try {
            if (Security.getProvider("BC") == null) {
                Security.addProvider(new BouncyCastleProvider());
                log.info("Registered BouncyCastle provider for Web Push cryptography");
            }
            pushService = new FcmPushService(publicKey, privateKey, subject);
            log.info("Web Push Service initialized with subject: {}", subject);
        } catch (Exception e) {
            log.error("Failed to initialize Web Push service: {}", e.getMessage(), e);
        }
    }

    public void sendPushNotification(String username, String title, String message) {
        sendPushNotification(username, title, message, null, null);
    }

    public void sendPushNotification(String username, String title, String message, String redirectUrl) {
        sendPushNotification(username, title, message, redirectUrl, null);
    }

    public void sendPushNotification(String username, String title, String message, String redirectUrl, Long requestId) {
        if (pushService == null) {
            log.warn("Web Push Service is not initialized. Cannot send push notification to {}", username);
            return;
        }

        String assignedDW = "N/A";
        String assignedWarden = "N/A";
        String assignedOffice = "office";

        if (requestId != null && requestId > 0) {
            ReductionForm form = reductionFormRepo.findById(requestId).orElse(null);
            if (form != null) {
                assignedDW = form.getAssignedDeputyWarden();
                if (assignedDW == null) assignedDW = "N/A";
                
                List<StaffUsers> wardens = staffUsersRepo.findByRole(Role.Warden);
                String matchedWarden = "warden" + form.getYear();
                if (wardens.stream().anyMatch(w -> w.getUserName().equalsIgnoreCase(matchedWarden))) {
                    assignedWarden = matchedWarden;
                } else if (wardens.stream().anyMatch(w -> w.getUserName().equalsIgnoreCase("warden"))) {
                    assignedWarden = "warden";
                } else {
                    assignedWarden = "warden";
                }
            }
        }

        log.info("Assigned Deputy Warden: {}", assignedDW);
        log.info("Assigned Warden: {}", assignedWarden);
        log.info("Assigned Office: {}", assignedOffice);

        List<String> targetUsernames = resolveUsernames(username);
        List<PushSubscription> userSubscriptions = new ArrayList<>();
        for (String u : targetUsernames) {
            pushSubscriptionRepository.findByUsername(u).ifPresent(userSubscriptions::add);
        }

        if (userSubscriptions.isEmpty()) {
            log.warn("missing subscription for username: {}", username);
            return;
        }

        String finalUrl = redirectUrl != null ? redirectUrl : getDefaultRedirectUrl(username);

        for (PushSubscription userSub : userSubscriptions) {
            if (userSub.getSubscriptions() == null || userSub.getSubscriptions().isEmpty()) {
                continue;
            }
            for (SubscriptionDetail detail : userSub.getSubscriptions()) {
                try {
                    log.info("Subscription found for: {}", userSub.getUsername());
                    log.info("Sending push notification to: {}", userSub.getUsername());
                    log.info("Endpoint: {}", detail.getEndpoint());
                    
                    log.info("Preparing web push request");
                    Subscription subscription = new Subscription(
                            detail.getEndpoint(),
                            new Subscription.Keys(detail.getP256dh(), detail.getAuth())
                    );

                    Map<String, String> payloadMap = new HashMap<>();
                    payloadMap.put("title", title != null ? title : "Test Notification");
                    payloadMap.put("message", message != null ? message : "No payload received.");
                    payloadMap.put("url", finalUrl != null ? finalUrl : "/");

                    String payload = objectMapper.writeValueAsString(payloadMap);

                    Notification notification = new Notification(subscription, payload);
                    log.info("Sending push payload");
                    HttpResponse response = pushService.send(notification);

                    int status = response.getStatusLine().getStatusCode();
                    log.info("Push response status: {}", status);
                    log.info("Push response received");
                    if (status == 201) {
                        log.info("Push notification sent successfully to user {} at endpoint {}", userSub.getUsername(), detail.getEndpoint());
                    } else if (status == 404 || status == 410) {
                        log.warn("invalid endpoint (status {}). Deleting subscription for endpoint: {}", status, detail.getEndpoint());
                        deleteEndpoint(detail.getEndpoint());
                    } else {
                        log.error("Push service returned error code {} for endpoint: {}", status, detail.getEndpoint());
                    }
                } catch (Exception e) {
                    log.error("push sending error for username {}: {}", userSub.getUsername(), e.getMessage());
                }
            }
        }
    }

    private List<String> resolveUsernames(String recipientUsername) {
        List<String> usernames = new ArrayList<>();
        usernames.add(recipientUsername);
        
        // If the recipient username is an email address, resolve it to the student register number / roll number
        if (recipientUsername != null && recipientUsername.contains("@")) {
            StudentDetails student = studentDetailsRepo.findByEmailId(recipientUsername);
            if (student != null) {
                if (student.getRegisterNo() != null) {
                    usernames.add(student.getRegisterNo());
                }
                if (student.getRollNo() != null) {
                    usernames.add(student.getRollNo());
                }
            }
        }
        return usernames;
    }

    private String getDefaultRedirectUrl(String username) {
        if (username == null) {
            return "/";
        }
        if (username.contains("@")) {
            return "/student-dashboard";
        }
        if ("warden".equalsIgnoreCase(username) || username.startsWith("warden")) {
            return "/warden";
        }
        if ("office".equalsIgnoreCase(username)) {
            return "/office";
        }
        if (username.startsWith("deputy")) {
            return "/deputy";
        }
        // Fallback for students using register/roll numbers
        return "/student-dashboard";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private void deleteEndpoint(String endpoint) {
        List<PushSubscription> otherSubs = pushSubscriptionRepository.findByEndpointLike(endpoint);
        for (PushSubscription otherSub : otherSubs) {
            if (otherSub.getSubscriptions() != null) {
                boolean removed = otherSub.getSubscriptions().removeIf(sub -> endpoint.equals(sub.getEndpoint()));
                if (removed) {
                    if (otherSub.getSubscriptions().isEmpty()) {
                        pushSubscriptionRepository.delete(otherSub);
                    } else {
                        pushSubscriptionRepository.save(otherSub);
                    }
                    log.info("Deleted invalid endpoint registered by user: {}", otherSub.getUsername());
                }
            }
        }
    }
}
