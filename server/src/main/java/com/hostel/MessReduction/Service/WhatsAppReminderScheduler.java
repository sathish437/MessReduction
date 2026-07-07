package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.ReductionFormHistory;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Component
public class WhatsAppReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppReminderScheduler.class);

    private final WhatsAppService whatsAppService;
    private final ReductionFormRepo reductionFormRepo;
    private final StaffUsersRepo staffUsersRepo;

    public WhatsAppReminderScheduler(WhatsAppService whatsAppService,
                                     ReductionFormRepo reductionFormRepo, StaffUsersRepo staffUsersRepo) {
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
    public void processReminders() {
        // TESTING MODE: Bypass working hours
        // if (!isWorkingHours()) {
        //     logger.info("[REMINDER SCHEDULER] Outside working hours (Mon-Sat, 9 AM - 4:30 PM) or Sunday. Skipping.");
        //     return;
        // }

        logger.info("[REMINDER SCHEDULER] Started processing pending reminders.");
        long startTime = System.currentTimeMillis();

        List<FormStatus> pendingStatuses = Arrays.asList(
                FormStatus.PendingDeputyWarden,
                FormStatus.PendingWarden,
                FormStatus.PendingOffice
        );

        List<ReductionForm> pendingForms = reductionFormRepo.findPendingFormsWithHistory(pendingStatuses);
        LocalDateTime now = LocalDateTime.now();

        Map<String, List<ReductionForm>> formsToRemindByStaff = new HashMap<>();
        Map<String, Boolean> staffEscalationFlag = new HashMap<>();
        List<ReductionForm> formsUpdatedWithTimestamp = new ArrayList<>();

        for (ReductionForm form : pendingForms) {
            if (form.getLastReminderSentAt() != null) {
                // TESTING MODE: Remind every minute
                long minutesSinceLastReminder = ChronoUnit.MINUTES.between(form.getLastReminderSentAt(), now);
                if (minutesSinceLastReminder < 1) {
                    continue; // Skip, already reminded recently
                }
            }

            LocalDateTime statusEnteredAt = getStatusEnteredAt(form);
            // TESTING MODE: Trigger escalation after 2 minutes instead of 12 hours
            long minutesInCurrentStatus = ChronoUnit.MINUTES.between(statusEnteredAt, now);
            boolean escalate = minutesInCurrentStatus > 2;

            if (form.getCurrentStatus() == FormStatus.PendingDeputyWarden) {
                addFormToRecipient(formsToRemindByStaff, form.getAssignedDeputyWarden(), form, escalate, staffEscalationFlag);
                if (escalate) {
                    addFormToRole(formsToRemindByStaff, "Warden", form, true, staffEscalationFlag);
                }
            } else if (form.getCurrentStatus() == FormStatus.PendingWarden) {
                addFormToRole(formsToRemindByStaff, "Warden", form, escalate, staffEscalationFlag);
                if (escalate) {
                    addFormToRole(formsToRemindByStaff, "Office", form, true, staffEscalationFlag);
                }
            } else if (form.getCurrentStatus() == FormStatus.PendingOffice) {
                addFormToRole(formsToRemindByStaff, "Office", form, escalate, staffEscalationFlag);
            }

            formsUpdatedWithTimestamp.add(form);
        }

        if (formsToRemindByStaff.isEmpty()) {
            logger.info("[REMINDER SCHEDULER] No reminders to send.");
            return;
        }

        for (Map.Entry<String, List<ReductionForm>> entry : formsToRemindByStaff.entrySet()) {
            String recipientUsername = entry.getKey();
            List<ReductionForm> forms = entry.getValue();

            String phoneNo = getPhoneNoByUsername(recipientUsername);
            if (phoneNo == null) {
                logger.warn("[REMINDER SCHEDULER] No phone number found for {}. Skipping.", recipientUsername);
                continue;
            }

            boolean needsEscalation = staffEscalationFlag.getOrDefault(recipientUsername, false);

            try {
                String messageBody;
                if (needsEscalation) {
                    messageBody = WhatsAppMessageBuilder.buildEscalationMessage(recipientUsername, forms);
                } else {
                    messageBody = WhatsAppMessageBuilder.buildReminderMessage(recipientUsername, forms);
                }

                if (messageBody == null) {
                    continue;
                }
                        
                whatsAppService.sendTemplateMessage(phoneNo, WhatsAppTemplates.REMINDER, java.util.Collections.singletonList(messageBody));
                logger.info("[REMINDER SCHEDULER] Successfully sent {} for {} requests to {}", 
                            needsEscalation ? "ESCALATION" : "REMINDER", forms.size(), recipientUsername);
            } catch (Exception e) {
                logger.error("[REMINDER SCHEDULER] Failed to send reminder to {}: {}", recipientUsername, e.getMessage());
                formsUpdatedWithTimestamp.removeAll(forms);
            }
        }

        for (ReductionForm form : formsUpdatedWithTimestamp) {
            form.setLastReminderSentAt(now);
        }
        if (!formsUpdatedWithTimestamp.isEmpty()) {
            reductionFormRepo.saveAll(formsUpdatedWithTimestamp);
        }

        logger.info("[REMINDER SCHEDULER] Completed processing in {} ms.", (System.currentTimeMillis() - startTime));
    }

    private LocalDateTime getStatusEnteredAt(ReductionForm form) {
        if (form.getHistory() == null || form.getHistory().isEmpty()) {
            return form.getSubmittedAt() != null ? form.getSubmittedAt() : LocalDateTime.now();
        }
        
        return form.getHistory().stream()
                .filter(h -> h.getToStatus() == form.getCurrentStatus())
                .map(ReductionFormHistory::getEventTimestamp)
                .max(LocalDateTime::compareTo)
                .orElse(form.getSubmittedAt() != null ? form.getSubmittedAt() : LocalDateTime.now());
    }

    private void addFormToRecipient(Map<String, List<ReductionForm>> map, String username, ReductionForm form, boolean escalate, Map<String, Boolean> flagMap) {
        if (username == null || username.isBlank()) return;
        map.computeIfAbsent(username, k -> new ArrayList<>()).add(form);
        if (escalate) {
            flagMap.put(username, true);
        }
    }

    private void addFormToRole(Map<String, List<ReductionForm>> map, String role, ReductionForm form, boolean escalate, Map<String, Boolean> flagMap) {
        staffUsersRepo.findAll().stream()
                .filter(s -> role.equalsIgnoreCase(s.getRole().name()))
                .forEach(s -> addFormToRecipient(map, s.getUserName(), form, escalate, flagMap));
    }

    private String getPhoneNoByUsername(String username) {
        if (username == null) return null;
        return staffUsersRepo.findByUserName(username)
                .map(staff -> staff.getPhoneNo())
                .orElse(null);
    }
}
