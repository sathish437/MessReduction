package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class WhatsAppBatchScheduler {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppBatchScheduler.class);

    @Value("${whatsapp.enabled:false}")
    private boolean whatsappEnabled;

    private final NotificationQueueService queueService;
    private final WhatsAppService whatsAppService;
    private final ReductionFormRepo reductionFormRepo;
    private final StaffUsersRepo staffUsersRepo;

    public WhatsAppBatchScheduler(NotificationQueueService queueService, WhatsAppService whatsAppService,
                                  ReductionFormRepo reductionFormRepo, StaffUsersRepo staffUsersRepo) {
        this.queueService = queueService;
        this.whatsAppService = whatsAppService;
        this.reductionFormRepo = reductionFormRepo;
        this.staffUsersRepo = staffUsersRepo;
    }

    private boolean isWorkingHours() {
        LocalDateTime now = LocalDateTime.now();
        if (now.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return false;
        }
        LocalTime time = now.toLocalTime();
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(16, 30);
        return !time.isBefore(startTime) && !time.isAfter(endTime);
    }

    @Scheduled(fixedRate = 60000) // TESTING MODE: 1 minute
    @Transactional
    public void processBatchNotifications() {
        if (!whatsappEnabled) {
            logger.info("[BATCH SCHEDULER] WhatsApp service is disabled. Skipping execution.");
            return;
        }

        // TESTING MODE: Bypass working hours
        // if (!isWorkingHours()) {
        //     logger.info("[BATCH SCHEDULER] Outside working hours (Mon-Sat, 9 AM - 4:30 PM) or Sunday. Skipping.");
        //     return;
        // }

        logger.info("[BATCH SCHEDULER] Started processing pending notifications.");
        long startTime = System.currentTimeMillis();

        List<AppNotification> pendingNotifications = queueService.getPendingNotifications();
        if (pendingNotifications.isEmpty()) {
            logger.info("[BATCH SCHEDULER] No pending notifications to process.");
            return;
        }
        
        logger.info("[Queue Count] Found {} pending notifications.", pendingNotifications.size());

        Map<String, List<AppNotification>> groupedNotifications = pendingNotifications.stream()
                .collect(Collectors.groupingBy(AppNotification::getRecipientUsername));

        for (Map.Entry<String, List<AppNotification>> entry : groupedNotifications.entrySet()) {
            String recipientUsername = entry.getKey();
            List<AppNotification> userNotifications = entry.getValue();

            // Only process Staff
            String phoneNo = getStaffPhoneNoByUsername(recipientUsername);
            if (phoneNo == null) {
                logger.warn("[BATCH SCHEDULER] No staff phone number found for user {}. Skipping.", recipientUsername);
                continue;
            }

            try {
                Set<Long> formIds = userNotifications.stream()
                        .map(AppNotification::getRelatedFormId)
                        .filter(id -> id != null && id > 0)
                        .collect(Collectors.toSet());

                if (formIds.isEmpty()) {
                    continue; // Do not send empty batches
                }

                List<ReductionForm> forms = reductionFormRepo.findAllById(formIds);
                if (forms.isEmpty()) continue;

                // Smart Notification Rules
                long uniqueCount = forms.stream().map(ReductionForm::getFormId).distinct().count();
                boolean condition1 = uniqueCount >= 5;
                
                LocalDateTime lastSent = queueService.getLastSentTimestamp(recipientUsername);
                boolean condition2 = (lastSent == null) || ChronoUnit.HOURS.between(lastSent, LocalDateTime.now()) > 2;
                
                boolean condition3 = forms.stream().anyMatch(f -> 
                        f.getSubmittedAt() != null && ChronoUnit.HOURS.between(f.getSubmittedAt(), LocalDateTime.now()) > 3);

                // TESTING MODE: Bypass smart rules
                // if (!condition1 && !condition2 && !condition3) {
                //     logger.info("[Smart Rule] Skipping notification for {}. Count: {}, LastSent: {}, Urgent: {}", 
                //                 recipientUsername, uniqueCount, lastSent, condition3);
                //     continue; // Skip sending, keep PENDING
                // }

                String messageBody = WhatsAppMessageBuilder.buildBatchSummaryMessage(recipientUsername, forms);
                if (messageBody == null) {
                    continue;
                }
                        
                whatsAppService.sendTemplateMessage(phoneNo, WhatsAppTemplates.BATCH_SUMMARY, java.util.Collections.singletonList(messageBody));

                List<Long> sentIds = userNotifications.stream().map(AppNotification::getId).collect(Collectors.toList());
                queueService.markAsSent(sentIds);
                logger.info("[Notification Sent] Processed {} requests for {}", uniqueCount, recipientUsername);

            } catch (Exception e) {
                logger.error("[Notification Failed] Failed to process batch for {}: {}", recipientUsername, e.getMessage());
                List<Long> failedIds = userNotifications.stream().map(AppNotification::getId).collect(Collectors.toList());
                queueService.incrementRetryCount(failedIds);
            }
        }

        logger.info("[BATCH SCHEDULER] Completed processing in {} ms.", (System.currentTimeMillis() - startTime));
    }

    private String getStaffPhoneNoByUsername(String username) {
        if (username == null) return null;
        return staffUsersRepo.findByUserName(username)
                .map(staff -> staff.getPhoneNo())
                .orElse(null);
    }
}
