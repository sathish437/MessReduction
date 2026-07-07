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

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

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

    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void processReminders() {
        logger.info("[REMINDER SCHEDULER] Started processing pending reminders.");
        long startTime = System.currentTimeMillis();

        List<FormStatus> pendingStatuses = Arrays.asList(
                FormStatus.PendingDeputyWarden,
                FormStatus.PendingWarden,
                FormStatus.PendingOffice
        );

        List<ReductionForm> pendingForms = reductionFormRepo.findPendingFormsWithHistory(pendingStatuses);
        LocalDateTime now = LocalDateTime.now();

        // Map to group forms by the recipient username to send ONE message per staff member
        Map<String, List<ReductionForm>> formsToRemindByStaff = new HashMap<>();
        List<ReductionForm> formsUpdatedWithTimestamp = new ArrayList<>();

        for (ReductionForm form : pendingForms) {
            // Filter 1: Has a reminder been sent within the last 10 minutes?
            if (form.getLastReminderSentAt() != null) {
                long minutesSinceLastReminder = ChronoUnit.MINUTES.between(form.getLastReminderSentAt(), now);
                if (minutesSinceLastReminder < 10) {
                    continue; // Skip, already reminded recently
                }
            }

            // Determine how long it has been in the CURRENT status to apply 12-hour escalation
            LocalDateTime statusEnteredAt = getStatusEnteredAt(form);
            long hoursInCurrentStatus = ChronoUnit.HOURS.between(statusEnteredAt, now);
            boolean escalate = hoursInCurrentStatus > 12;

            // Route to appropriate staff based on status and escalation
            if (form.getCurrentStatus() == FormStatus.PendingDeputyWarden) {
                addFormToRecipient(formsToRemindByStaff, form.getAssignedDeputyWarden(), form);
                if (escalate) {
                    addFormToRole(formsToRemindByStaff, "Warden", form);
                }
            } else if (form.getCurrentStatus() == FormStatus.PendingWarden) {
                addFormToRole(formsToRemindByStaff, "Warden", form);
                if (escalate) {
                    addFormToRole(formsToRemindByStaff, "Office", form);
                }
            } else if (form.getCurrentStatus() == FormStatus.PendingOffice) {
                addFormToRole(formsToRemindByStaff, "Office", form);
            }

            formsUpdatedWithTimestamp.add(form);
        }

        if (formsToRemindByStaff.isEmpty()) {
            logger.info("[REMINDER SCHEDULER] No reminders to send.");
            return;
        }

        // Dispatch Reminders
        for (Map.Entry<String, List<ReductionForm>> entry : formsToRemindByStaff.entrySet()) {
            String recipientUsername = entry.getKey();
            List<ReductionForm> forms = entry.getValue();

            String phoneNo = getPhoneNoByUsername(recipientUsername);
            if (phoneNo == null) {
                logger.warn("[REMINDER SCHEDULER] No phone number found for {}. Skipping.", recipientUsername);
                continue;
            }

            try {
                // Construct a neatly formatted string for the template variable
                String messageBody = WhatsAppMessageBuilder.buildReminderMessage(recipientUsername, forms);
                if (messageBody == null) {
                    continue;
                }
                        
                whatsAppService.sendTemplateMessage(phoneNo, WhatsAppTemplates.REMINDER, java.util.Collections.singletonList(messageBody));
                logger.info("[REMINDER SCHEDULER] Successfully sent reminder for {} requests to {}", forms.size(), recipientUsername);
            } catch (Exception e) {
                logger.error("[REMINDER SCHEDULER] Failed to send reminder to {}: {}", recipientUsername, e.getMessage());
                // We do NOT update the timestamp if it fails, so it will retry next run
                formsUpdatedWithTimestamp.removeAll(forms);
            }
        }

        // Update timestamps in bulk
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
        
        // Find the latest history record that transitions into the current status
        return form.getHistory().stream()
                .filter(h -> h.getToStatus() == form.getCurrentStatus())
                .map(ReductionFormHistory::getEventTimestamp)
                .max(LocalDateTime::compareTo)
                .orElse(form.getSubmittedAt() != null ? form.getSubmittedAt() : LocalDateTime.now());
    }

    private void addFormToRecipient(Map<String, List<ReductionForm>> map, String username, ReductionForm form) {
        if (username == null || username.isBlank()) return;
        map.computeIfAbsent(username, k -> new ArrayList<>()).add(form);
    }

    private void addFormToRole(Map<String, List<ReductionForm>> map, String role, ReductionForm form) {
        // We find the staff user by role (in a real scenario, could be multiple Wardens, but the app uses specific logic)
        staffUsersRepo.findAll().stream()
                .filter(s -> role.equalsIgnoreCase(s.getRole().name()))
                .forEach(s -> addFormToRecipient(map, s.getUserName(), form));
    }

    private String getPhoneNoByUsername(String username) {
        if (username == null) return null;
        return staffUsersRepo.findByUserName(username)
                .map(staff -> staff.getPhoneNo())
                .orElse(null);
    }
}
