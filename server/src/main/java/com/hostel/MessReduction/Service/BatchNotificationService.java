package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.QueuedNotification;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Repo.QueuedNotificationRepository;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BatchNotificationService {
    private static final Logger logger = LoggerFactory.getLogger(BatchNotificationService.class);

    private final QueuedNotificationRepository queuedRepo;
    private final PushNotificationService pushNotificationService;
    private final FirebaseNotificationService firebaseNotificationService;
    private final ReductionFormRepo reductionFormRepo;

    @Value("${notification.batch.enabled:true}")
    private boolean batchEnabled;

    public BatchNotificationService(QueuedNotificationRepository queuedRepo, 
                                    PushNotificationService pushNotificationService,
                                    FirebaseNotificationService firebaseNotificationService,
                                    ReductionFormRepo reductionFormRepo) {
        this.queuedRepo = queuedRepo;
        this.pushNotificationService = pushNotificationService;
        this.firebaseNotificationService = firebaseNotificationService;
        this.reductionFormRepo = reductionFormRepo;
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

    @Transactional
    public void processBatch() {
        logger.info("Batch Scheduler processBatch started");
        List<QueuedNotification> pending = queuedRepo.findUnprocessedForUpdate();
        if (pending == null || pending.isEmpty()) {
            logger.info("No pending queued notifications found.");
            return;
        }

        // Group pending notifications by recipientUsername
        Map<String, List<QueuedNotification>> grouped = pending.stream()
                .filter(qn -> qn.getRecipientUsername() != null && !qn.getRecipientUsername().trim().isEmpty())
                .collect(Collectors.groupingBy(QueuedNotification::getRecipientUsername));

        for (Map.Entry<String, List<QueuedNotification>> entry : grouped.entrySet()) {
            String recipient = entry.getKey();
            List<QueuedNotification> notifications = entry.getValue();
            if (notifications == null || notifications.isEmpty()) {
                continue;
            }

            // Extract distinct form IDs referenced in this batch
            Set<Long> formIds = notifications.stream()
                    .map(QueuedNotification::getReferenceId)
                    .filter(id -> id != null && id > 0)
                    .collect(Collectors.toSet());

            Map<Long, ReductionForm> formMap = new HashMap<>();
            if (!formIds.isEmpty()) {
                List<ReductionForm> forms = reductionFormRepo.findByFormIdIn(new ArrayList<>(formIds));
                if (forms != null) {
                    for (ReductionForm f : forms) {
                        if (f != null && f.getFormId() != null) {
                            formMap.put(f.getFormId(), f);
                        }
                    }
                }
            }

            // Count valid and currently pending requests for this recipient in this batch
            Set<Long> validFormIds = new HashSet<>();
            for (Long fid : formIds) {
                ReductionForm form = formMap.get(fid);
                if (isFormPendingForRecipient(form, recipient)) {
                    validFormIds.add(fid);
                }
            }

            long nonFormCount = notifications.stream()
                    .filter(qn -> qn.getReferenceId() == null || qn.getReferenceId() <= 0)
                    .count();

            int count = validFormIds.size() + (int) nonFormCount;

            logger.info("Found {} queued records ({} valid distinct requests) for {}", notifications.size(), count, recipient);

            try {
                if (count > 0) {
                    String title;
                    String body;
                    Long singleId = validFormIds.size() == 1 ? validFormIds.iterator().next() : (notifications.get(0).getReferenceId() != null ? notifications.get(0).getReferenceId() : -1L);
                    String redirectUrl = getRedirectUrl(recipient, singleId, count);

                    if (count == 1) {
                        title = "New Mess Reduction Request";
                        body = "A new mess reduction request requires your approval.";
                    } else {
                        title = "New Mess Reduction Requests";
                        body = "You have " + count + " new requests waiting for approval.";
                    }

                    logger.info("Sending Batch Push Notification to {} (count: {})", recipient, count);
                    pushNotificationService.sendPushNotification(recipient, title, body, redirectUrl, -1L);

                    Map<String, String> fcmData = new HashMap<>();
                    fcmData.put("type", "BATCH_REQUEST");
                    fcmData.put("url", redirectUrl);
                    fcmData.put("count", String.valueOf(count));
                    firebaseNotificationService.sendNotificationToUser(recipient, title, body, fcmData);

                    logger.info("Batch Push Sent Successfully to {}", recipient);
                } else {
                    logger.info("Skipping push notification for {} as all {} queued requests were already handled/deleted.", recipient, notifications.size());
                }

                LocalDateTime now = LocalDateTime.now();
                for (QueuedNotification qn : notifications) {
                    qn.setProcessed(true);
                    qn.setProcessedAt(now);
                }
                queuedRepo.saveAll(notifications);
                logger.info("Marked {} queued notifications as processed for {}", notifications.size(), recipient);
            } catch (Exception e) {
                logger.error("Failed to send batch push notification to {}: {}", recipient, e.getMessage(), e);
                // Keep the notifications unprocessed for retry on next scheduler execution
            }
        }
    }

    private boolean isFormPendingForRecipient(ReductionForm form, String recipient) {
        if (form == null || !form.isActive() || form.isDeletedByStudent()) {
            return false;
        }
        if (recipient == null) {
            return false;
        }
        if (recipient.startsWith("deputy")) {
            return form.getCurrentStatus() == FormStatus.PendingDeputyWarden;
        }
        if ("warden".equalsIgnoreCase(recipient) || recipient.startsWith("warden")) {
            return form.getCurrentStatus() == FormStatus.PendingWarden;
        }
        if ("office".equalsIgnoreCase(recipient)) {
            return form.getCurrentStatus() == FormStatus.PendingOffice;
        }
        return form.getCurrentStatus() == FormStatus.PendingDeputyWarden
                || form.getCurrentStatus() == FormStatus.PendingWarden
                || form.getCurrentStatus() == FormStatus.PendingOffice;
    }

    private String getRedirectUrl(String recipient, Long singleFormId, int totalCount) {
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
            if (totalCount == 1 && singleFormId != null && singleFormId > 0) {
                return "/deputy/request/" + singleFormId;
            }
            return "/deputy";
        }
        return "/student-dashboard";
    }
}

