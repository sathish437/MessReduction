package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.QueuedNotification;
import com.hostel.MessReduction.Repo.QueuedNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BatchNotificationService {
    private static final Logger logger = LoggerFactory.getLogger(BatchNotificationService.class);

    private final QueuedNotificationRepository queuedRepo;
    private final PushNotificationService pushNotificationService;

    @Value("${notification.batch.enabled:true}")
    private boolean batchEnabled;

    public BatchNotificationService(QueuedNotificationRepository queuedRepo, PushNotificationService pushNotificationService) {
        this.queuedRepo = queuedRepo;
        this.pushNotificationService = pushNotificationService;
    }

    public void enqueueOrSendPushNotification(String recipientUsername, String title, String message, String redirectUrl, String type, Long relatedFormId) {
        if (batchEnabled && recipientUsername != null && !recipientUsername.contains("@")) {
            QueuedNotification qn = new QueuedNotification();
            qn.setRecipientUsername(recipientUsername);
            qn.setNotificationType(type);
            qn.setReferenceId(relatedFormId);
            qn.setProcessed(false);
            queuedRepo.save(qn);
            logger.info("Queued notification for {}", recipientUsername);
        } else {
            try {
                pushNotificationService.sendPushNotification(recipientUsername, title, message, redirectUrl, relatedFormId);
            } catch (Exception e) {
                logger.error("Failed to send push notification immediately for {}: {}", recipientUsername, e.getMessage());
            }
        }
    }

    public void processBatch() {
        logger.info("Batch Scheduler processBatch started");
        List<QueuedNotification> pending = queuedRepo.findUnprocessedForUpdate();
        if (pending.isEmpty()) {
            logger.info("No pending queued notifications found.");
            return;
        }

        // Group pending notifications by recipientUsername
        Map<String, List<QueuedNotification>> grouped = pending.stream()
                .collect(Collectors.groupingBy(QueuedNotification::getRecipientUsername));

        for (Map.Entry<String, List<QueuedNotification>> entry : grouped.entrySet()) {
            String recipient = entry.getKey();
            List<QueuedNotification> notifications = entry.getValue();
            int count = notifications.size();

            logger.info("Found {} pending notifications for {}", count, recipient);

            String title;
            String body;
            if (count == 1) {
                title = "New Mess Reduction Request";
                body = "You have 1 new request waiting for approval.";
            } else {
                title = "New Mess Reduction Requests";
                body = "You have " + count + " new requests waiting for approval.";
            }

            String redirectUrl = getRedirectUrl(recipient, notifications);

            logger.info("Sending Batch Push Notification to {}", recipient);
            try {
                pushNotificationService.sendPushNotification(recipient, title, body, redirectUrl, -1L);
                logger.info("Batch Push Sent Successfully to {}", recipient);

                LocalDateTime now = LocalDateTime.now();
                for (QueuedNotification qn : notifications) {
                    qn.setProcessed(true);
                    qn.setProcessedAt(now);
                }
                queuedRepo.saveAll(notifications);
                logger.info("Marked notifications as processed for {}", recipient);
            } catch (Exception e) {
                logger.error("Failed to send batch push notification to {}: {}", recipient, e.getMessage());
                // Keep the notifications unprocessed for retry on next scheduler execution
            }
        }
    }

    private String getRedirectUrl(String recipient, List<QueuedNotification> notifications) {
        if (recipient == null) {
            return "/";
        }
        if (recipient.contains("@")) {
            return "/student-dashboard";
        }
        if ("warden".equalsIgnoreCase(recipient) || recipient.startsWith("warden")) {
            return "/warden";
        }
        if ("office".equalsIgnoreCase(recipient)) {
            return "/office";
        }
        if (recipient.startsWith("deputy")) {
            if (notifications.size() == 1 && notifications.get(0).getReferenceId() != null && notifications.get(0).getReferenceId() > 0) {
                return "/deputy/request/" + notifications.get(0).getReferenceId();
            }
            return "/deputy";
        }
        return "/student-dashboard";
    }
}
