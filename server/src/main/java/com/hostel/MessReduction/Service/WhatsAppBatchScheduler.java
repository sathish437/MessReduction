package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class WhatsAppBatchScheduler {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppBatchScheduler.class);

    private final NotificationQueueService queueService;
    private final WhatsAppService whatsAppService;
    private final ReductionFormRepo reductionFormRepo;
    private final StaffUsersRepo staffUsersRepo;
    private final StudentDetailsRepo studentDetailsRepo;

    public WhatsAppBatchScheduler(NotificationQueueService queueService, WhatsAppService whatsAppService,
                                  ReductionFormRepo reductionFormRepo, StaffUsersRepo staffUsersRepo, StudentDetailsRepo studentDetailsRepo) {
        this.queueService = queueService;
        this.whatsAppService = whatsAppService;
        this.reductionFormRepo = reductionFormRepo;
        this.staffUsersRepo = staffUsersRepo;
        this.studentDetailsRepo = studentDetailsRepo;
    }

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void processBatchNotifications() {
        logger.info("[BATCH SCHEDULER] Started processing pending notifications.");
        long startTime = System.currentTimeMillis();

        List<AppNotification> pendingNotifications = queueService.getPendingNotifications();
        if (pendingNotifications.isEmpty()) {
            logger.info("[BATCH SCHEDULER] No pending notifications to process.");
            return;
        }
        
        logger.info("[Queue Count] Found {} pending notifications.", pendingNotifications.size());

        // Group by Recipient
        Map<String, List<AppNotification>> groupedNotifications = pendingNotifications.stream()
                .collect(Collectors.groupingBy(AppNotification::getRecipientUsername));

        for (Map.Entry<String, List<AppNotification>> entry : groupedNotifications.entrySet()) {
            String recipientUsername = entry.getKey();
            List<AppNotification> userNotifications = entry.getValue();

            logger.info("[Recipient] Processing batch for recipient: {}", recipientUsername);

            // Fetch recipient's phone number
            String phoneNo = getPhoneNoByUsername(recipientUsername);
            if (phoneNo == null) {
                logger.warn("[BATCH SCHEDULER] No phone number found for user {}. Skipping.", recipientUsername);
                // We keep it pending. Eventually it could be cleaned up or marked failed if retry counts exceed limit, but instructions say keep pending.
                continue;
            }

            try {
                // Deduplicate requests by Form ID
                Set<Long> formIds = userNotifications.stream()
                        .map(AppNotification::getRelatedFormId)
                        .filter(id -> id != null && id > 0)
                        .collect(Collectors.toSet());

                if (formIds.isEmpty()) {
                    // It's possible the notification doesn't relate to a form (e.g. system alert)
                    // But instructions specifically requested Mess Reduction Requests summary.
                    // If it's for students, they might get standard notification strings.
                    // Let's check role.
                    String role = userNotifications.get(0).getRecipientRole();
                    if ("Student".equalsIgnoreCase(role)) {
                        List<String> messages = userNotifications.stream().map(AppNotification::getMessage).distinct().collect(Collectors.toList());
                        // Using a single parameter for the batch update message string
                        String updatesStr = String.join("\n- ", messages);
                        whatsAppService.sendTemplateMessage(phoneNo, WhatsAppTemplates.STUDENT_UPDATE, java.util.Collections.singletonList("- " + updatesStr));
                    } else {
                        // Staff but no form ID? Just mark sent if it's aggregated or something.
                        continue;
                    }
                } else {
                    // Staff receiving batch of form requests
                    List<ReductionForm> forms = reductionFormRepo.findAllById(formIds);
                    if (forms.isEmpty()) continue;

                    String messageBody = WhatsAppMessageBuilder.buildBatchSummaryMessage(recipientUsername, forms);
                    if (messageBody == null) {
                        logger.info("No pending notifications to send for {}.", recipientUsername);
                        continue;
                    }
                            
                    whatsAppService.sendTemplateMessage(phoneNo, WhatsAppTemplates.BATCH_SUMMARY, java.util.Collections.singletonList(messageBody));
                }

                // If success, update to SENT
                List<Long> sentIds = userNotifications.stream().map(AppNotification::getId).collect(Collectors.toList());
                queueService.markAsSent(sentIds);
                logger.info("[Database Updated] Marked {} notifications as SENT in database.", sentIds.size());
                logger.info("[Notification Sent] Successfully processed {} requests for {}", userNotifications.size(), recipientUsername);

            } catch (Exception e) {
                logger.error("[Notification Failed] Failed to process batch for {}: {}", recipientUsername, e.getMessage());
                // Increment retry count
                List<Long> failedIds = userNotifications.stream().map(AppNotification::getId).collect(Collectors.toList());
                queueService.incrementRetryCount(failedIds);
                logger.info("[Database Updated] Incremented retry count for {} notifications.", failedIds.size());
            }
        }

        logger.info("[BATCH SCHEDULER] Completed processing in {} ms.", (System.currentTimeMillis() - startTime));
    }

    private String getPhoneNoByUsername(String username) {
        if (username == null) return null;
        
        // Is it a staff user?
        return staffUsersRepo.findByUserName(username)
                .map(staff -> staff.getPhoneNo())
                .orElseGet(() -> {
                    var student = studentDetailsRepo.findByEmailId(username);
                    return student != null ? student.getPhoneNo() : null;
                });
    }
}
