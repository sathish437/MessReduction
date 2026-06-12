package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.ReductionFormHistory;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class ReminderScheduler {

    // Testing Mode configuration
    private static final boolean TESTING_MODE = true;
    private static final LocalDateTime APP_START_TIME = LocalDateTime.now();

    // Changed to 1 for development/testing. Revert to 30 for production.
    private static final long REMINDER_INTERVAL_MINUTES = 1;
    private static final long ESCALATION_INTERVAL_HOURS = 3;
    private static final long ESCALATION_THRESHOLD_HOURS = 3;

    private final ReductionFormRepo reductionFormRepo;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final StaffUsersRepo staffUsersRepo;
    private final com.hostel.MessReduction.Repo.ReductionFormHistoryRepo reductionFormHistoryRepo;

    public ReminderScheduler(ReductionFormRepo reductionFormRepo,
                             EmailService emailService,
                             NotificationService notificationService,
                             StaffUsersRepo staffUsersRepo,
                             com.hostel.MessReduction.Repo.ReductionFormHistoryRepo reductionFormHistoryRepo) {
        this.reductionFormRepo = reductionFormRepo;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.staffUsersRepo = staffUsersRepo;
        this.reductionFormHistoryRepo = reductionFormHistoryRepo;
    }

    // Runs every 1 minute to check for reminders and escalations (dev/testing)
    @Scheduled(fixedRate = 60000)
    public void processRemindersAndEscalations() {
        if (TESTING_MODE) {
            return; // Completely disable automated reminder/escalation emails during testing
        }
        
        List<FormStatus> pendingStatuses = List.of(
                FormStatus.PendingWarden,
                FormStatus.PendingDeputyWarden,
                FormStatus.PendingOffice
        );

        List<ReductionForm> pendingForms;
        if (TESTING_MODE) {
            pendingForms = reductionFormRepo.findByCurrentStatusInAndSubmittedAtAfter(pendingStatuses, APP_START_TIME);
        } else {
            pendingForms = reductionFormRepo.findByCurrentStatusIn(pendingStatuses);
        }
        LocalDateTime now = LocalDateTime.now();

        for (ReductionForm form : pendingForms) {
            if (form.getSubmittedAt() == null) continue;

            long minutesElapsed = ChronoUnit.MINUTES.between(form.getSubmittedAt(), now);
            long hoursElapsed   = ChronoUnit.HOURS.between(form.getSubmittedAt(), now);

            // ── 1. Emergency fast-track (existing one-shot, unchanged) ──────────────
            if (form.isEmergency()) {
                if (minutesElapsed >= 15 && !form.isEmergency15MinSent()) {
                    sendEmailAndNotificationToApprover(form, "EMERGENCY", false);
                    form.setEmergency15MinSent(true);
                    reductionFormRepo.save(form);
                }
                continue; // Emergency forms don't use the repeating reminder flow
            }

            // ── 2. Repeating 30-minute reminders ────────────────────────────────────
            if (minutesElapsed >= REMINDER_INTERVAL_MINUTES) {
                boolean shouldSendReminder;
                if (form.getLastReminderSentAt() == null) {
                    // First reminder — send if at least 30 min have passed since submission
                    shouldSendReminder = true;
                } else {
                    // Subsequent reminders — send if 30 min have passed since last reminder
                    long minutesSinceLast = ChronoUnit.MINUTES.between(form.getLastReminderSentAt(), now);
                    shouldSendReminder = minutesSinceLast >= REMINDER_INTERVAL_MINUTES;
                }

                if (shouldSendReminder) {
                    sendEmailAndNotificationToApprover(form, "REMINDER", false);
                    form.setLastReminderSentAt(now);
                    reductionFormRepo.save(form);
                }
            }

            // ── 3. Repeating 3-hour escalation alerts ───────────────────────────────
            if (hoursElapsed >= ESCALATION_THRESHOLD_HOURS) {
                boolean shouldSendEscalation;
                if (form.getLastEscalationSentAt() == null) {
                    // First escalation — send if at least 3 hours have passed since submission
                    shouldSendEscalation = true;
                } else {
                    // Subsequent escalations — send if 3 hours have passed since last escalation
                    long hoursSinceLast = ChronoUnit.HOURS.between(form.getLastEscalationSentAt(), now);
                    shouldSendEscalation = hoursSinceLast >= ESCALATION_INTERVAL_HOURS;
                }

                if (shouldSendEscalation) {
                    sendEmailAndNotificationToApprover(form, "ESCALATION", true);
                    form.setLastEscalationSentAt(now);
                    reductionFormRepo.save(form);
                }
            }
        }
    }

    /**
     * Sends email + in-app notification to the appropriate approver for the given form.
     * isEscalation=true → sends escalation email; isEscalation=false → sends reminder email.
     */
    private void sendEmailAndNotificationToApprover(ReductionForm form, String type, boolean isEscalation) {
        Role targetRole = getTargetRole(form.getCurrentStatus());
        if (targetRole == null) return;

        List<StaffUsers> staffList = staffUsersRepo.findByRole(targetRole);
        boolean anySent = false;
        for (StaffUsers staff : staffList) {
            // For Wardens, only notify the warden whose username matches the form's year
            if (targetRole == Role.Warden) {
                String expectedUsername = "warden" + form.getYear();
                if (!staff.getUserName().equalsIgnoreCase(expectedUsername)) {
                    continue;
                }
            }

            // Send email
            try {
                if (isEscalation) {
                    emailService.sendEscalationEmail(staff.getGmail(), form);
                } else {
                    emailService.sendReminderEmail(staff.getGmail(), form, type);
                }
                anySent = true;
            } catch (Exception ex) {
                // swallow to ensure scheduler continues; EmailService already logs failures
            }

            // Send in-app notification to the staff member
            String notifMessage = isEscalation
                    ? "🚨 ESCALATION: Request #" + form.getFormId() + " from " + form.getStudentDetails().getName() + " has been pending for over " + ChronoUnit.HOURS.between(form.getSubmittedAt(), LocalDateTime.now()) + " hour(s). Immediate action required!"
                    : "⏰ Reminder: Request #" + form.getFormId() + " from " + form.getStudentDetails().getName() + " is still awaiting your approval.";

            String notifType = isEscalation ? "ESCALATION" : "REMINDER";
            notificationService.createNotification(staff.getUserName(), notifMessage, notifType, form.getFormId());
        }

        // Record one history entry per form send (reminder or escalation)
        if (anySent) {
            ReductionFormHistory history = new ReductionFormHistory();
            history.setReductionForm(form);
            history.setFromStatus(form.getCurrentStatus());
            history.setToStatus(form.getCurrentStatus());
            history.setEventType(isEscalation ? "Escalation Sent" : "Reminder Sent");
            history.setPerformedBy("system");
            history.setComment(isEscalation ? "Escalation alert sent by scheduler" : "Reminder sent by scheduler");
            history.setEventTimestamp(java.time.LocalDateTime.now());
            reductionFormHistoryRepo.save(history);
        }
    }

    private Role getTargetRole(FormStatus status) {
        switch (status) {
            case PendingWarden:        return Role.Warden;
            case PendingDeputyWarden:  return Role.DeputyWarden;
            case PendingOffice:        return Role.Office;
            default:                   return null;
        }
    }
}
