package com.hostel.MessReduction.Service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FirebaseNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseNotificationService.class);

    /**
     * Send a Firebase Cloud Messaging (FCM) notification to a specific device token.
     *
     * @param token The FCM device registration token.
     * @param title The title of the notification.
     * @param body  The body text of the notification.
     */
    public void sendNotification(String token, String title, String body) {
        if (token == null || token.trim().isEmpty()) {
            logger.warn("Attempted to send FCM notification but the token is empty. Title: {}", title);
            return;
        }

        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(notification)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("Successfully sent FCM message: {} to token: {}", response, token);

        } catch (FirebaseMessagingException e) {
            logger.error("Failed to send FCM message to token: {}. Error code: {}. Exception: {}", 
                         token, e.getErrorCode(), e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error occurred while sending FCM message to token: {}. Exception: {}", 
                         token, e.getMessage(), e);
        }
    }
}
