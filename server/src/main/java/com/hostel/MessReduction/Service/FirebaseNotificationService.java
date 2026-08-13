package com.hostel.MessReduction.Service;

import com.google.firebase.messaging.*;
import com.hostel.MessReduction.Config.FirebaseConfig;
import com.hostel.MessReduction.Entity.FcmToken;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.FcmTokenRepository;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class FirebaseNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseNotificationService.class);

    private final FirebaseConfig firebaseConfig;
    private final FcmTokenRepository fcmTokenRepository;
    private final StudentDetailsRepo studentDetailsRepo;

    public FirebaseNotificationService(FirebaseConfig firebaseConfig,
                                       FcmTokenRepository fcmTokenRepository,
                                       StudentDetailsRepo studentDetailsRepo) {
        this.firebaseConfig = firebaseConfig;
        this.fcmTokenRepository = fcmTokenRepository;
        this.studentDetailsRepo = studentDetailsRepo;
    }

    /**
     * Send an FCM notification to a specific user across all their active registered devices.
     */
    public void sendNotificationToUser(String username, String title, String body, Map<String, String> data) {
        if (username == null || username.trim().isEmpty()) {
            return;
        }
        sendNotificationToUsers(Collections.singletonList(username), title, body, data);
    }

    /**
     * Send an FCM notification to a list of usernames asynchronously.
     */
    public void sendNotificationToUsers(List<String> usernames, String title, String body, Map<String, String> data) {
        if (usernames == null || usernames.isEmpty()) {
            return;
        }

        if (!firebaseConfig.isInitialized()) {
            logger.debug("Firebase is not initialized. Skipping FCM notification for users: {}", usernames);
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                doSendNotificationToUsers(usernames, title, body, data);
            } catch (Exception e) {
                logger.error("Error dispatching async FCM notification for users {}: {}", usernames, e.getMessage());
            }
        });
    }

    private void doSendNotificationToUsers(List<String> rawUsernames, String title, String body, Map<String, String> data) {
        Set<String> targetUsernames = new HashSet<>();
        for (String u : rawUsernames) {
            targetUsernames.addAll(resolveUsernames(u));
        }

        List<FcmToken> tokens = fcmTokenRepository.findByUsernameInAndActiveTrue(new ArrayList<>(targetUsernames));
        if (tokens.isEmpty()) {
            logger.debug("No active FCM tokens found for users: {}", targetUsernames);
            return;
        }

        logger.info("Found {} active FCM token(s) for users: {}", tokens.size(), targetUsernames);

        for (FcmToken tokenEntity : tokens) {
            sendToSingleToken(tokenEntity, title, body, data);
        }
    }

    /**
     * Send to a single token directly.
     */
    public void sendNotificationToToken(String token, String title, String body, Map<String, String> data) {
        if (token == null || token.trim().isEmpty() || !firebaseConfig.isInitialized()) {
            return;
        }
        FcmToken dummyEntity = new FcmToken("direct", token, "web");
        CompletableFuture.runAsync(() -> sendToSingleToken(dummyEntity, title, body, data));
    }

    private void sendToSingleToken(FcmToken tokenEntity, String title, String body, Map<String, String> data) {
        String tokenStr = tokenEntity.getToken();
        String username = tokenEntity.getUsername();

        try {
            Notification notification = Notification.builder()
                    .setTitle(title != null ? title : "Mess Reduction Update")
                    .setBody(body != null ? body : "You have a new update.")
                    .build();

            Map<String, String> safeData = new HashMap<>();
            if (data != null) {
                for (Map.Entry<String, String> entry : data.entrySet()) {
                    if (entry.getKey() != null && entry.getValue() != null) {
                        safeData.put(entry.getKey(), entry.getValue());
                    }
                }
            }
            if (!safeData.containsKey("title") && title != null) safeData.put("title", title);
            if (!safeData.containsKey("message") && body != null) safeData.put("message", body);

            String targetUrl = safeData.getOrDefault("url", "/");

            WebpushConfig webpushConfig = WebpushConfig.builder()
                    .putHeader("Urgency", "high")
                    .setNotification(WebpushNotification.builder()
                            .setIcon("/logo.png")
                            .setBadge("/badge.png")
                            .build())
                    .setFcmOptions(WebpushFcmOptions.builder()
                            .setLink(targetUrl)
                            .build())
                    .build();

            Message message = Message.builder()
                    .setToken(tokenStr)
                    .setNotification(notification)
                    .putAllData(safeData)
                    .setWebpushConfig(webpushConfig)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("FCM notification sent successfully to user {} (Message ID: {})", username, response);

        } catch (FirebaseMessagingException e) {
            handleFirebaseMessagingException(e, tokenStr, username);
        } catch (Exception e) {
            logger.error("Unexpected error sending FCM notification to user {}: {}", username, e.getMessage());
        }
    }

    private void handleFirebaseMessagingException(FirebaseMessagingException e, String tokenStr, String username) {
        MessagingErrorCode errorCode = e.getMessagingErrorCode();
        String message = e.getMessage() != null ? e.getMessage().toLowerCase() : "";

        boolean isInvalidToken = (errorCode == MessagingErrorCode.UNREGISTERED)
                || (errorCode == MessagingErrorCode.INVALID_ARGUMENT && message.contains("token"))
                || message.contains("not registered")
                || message.contains("invalid registration token")
                || message.contains("mismatched credential");

        if (isInvalidToken) {
            logger.warn("Invalid FCM token detected for user {}. Deactivating token. Error: {}", username, e.getMessage());
            deactivateInvalidToken(tokenStr);
        } else {
            logger.error("FCM notification failed for user {}. Error code: {}. Exception: {}", username, errorCode, e.getMessage());
        }
    }

    @Transactional
    public void deactivateInvalidToken(String token) {
        try {
            fcmTokenRepository.deactivateToken(token);
            logger.info("Invalid FCM token deactivated in database");
        } catch (Exception e) {
            logger.error("Failed to deactivate invalid FCM token: {}", e.getMessage());
        }
    }

    private List<String> resolveUsernames(String recipientUsername) {
        List<String> usernames = new ArrayList<>();
        if (recipientUsername == null || recipientUsername.trim().isEmpty()) {
            return usernames;
        }

        usernames.add(recipientUsername.trim());

        // If recipient username is email, resolve to register number and roll number
        if (recipientUsername.contains("@")) {
            try {
                StudentDetails student = studentDetailsRepo.findByEmailId(recipientUsername.trim());
                if (student != null) {
                    if (student.getRegisterNo() != null && !student.getRegisterNo().isEmpty()) {
                        usernames.add(student.getRegisterNo().trim());
                    }
                    if (student.getRollNo() != null && !student.getRollNo().isEmpty()) {
                        usernames.add(student.getRollNo().trim());
                    }
                }
            } catch (Exception e) {
                logger.warn("Could not resolve student aliases for email {}: {}", recipientUsername, e.getMessage());
            }
        }

        return usernames;
    }
}
