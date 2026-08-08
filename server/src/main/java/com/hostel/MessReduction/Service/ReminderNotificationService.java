package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.NotificationReminderLog;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.NotificationReminderLogRepository;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReminderNotificationService {
    private static final Logger logger = LoggerFactory.getLogger(ReminderNotificationService.class);

    private final ReductionFormRepo reductionFormRepo;
    private final StaffUsersRepo staffUsersRepo;
    private final NotificationReminderLogRepository reminderLogRepo;
    private final PushNotificationService pushNotificationService;
    private final com.hostel.MessReduction.Repo.SystemSettingsRepo systemSettingsRepo;

    @Value("${notification.reminder.enabled:true}")
    private boolean reminderEnabled;

    @Value("${notification.reminder.interval.hours:3}")
    private String reminderIntervalHoursStr;

    public ReminderNotificationService(ReductionFormRepo reductionFormRepo,
                                       StaffUsersRepo staffUsersRepo,
                                       NotificationReminderLogRepository reminderLogRepo,
                                       PushNotificationService pushNotificationService,
                                       com.hostel.MessReduction.Repo.SystemSettingsRepo systemSettingsRepo) {
        this.reductionFormRepo = reductionFormRepo;
        this.staffUsersRepo = staffUsersRepo;
        this.reminderLogRepo = reminderLogRepo;
        this.pushNotificationService = pushNotificationService;
        this.systemSettingsRepo = systemSettingsRepo;
    }

    public void processReminders() {
        if (!reminderEnabled) {
            logger.info("Reminder Browser Push Notifications are disabled.");
            return;
        }

        logger.info("Checking pending requests for reminders");

        double intervalHours;
        try {
            intervalHours = Double.parseDouble(reminderIntervalHoursStr);
        } catch (NumberFormatException e) {
            logger.error("Invalid notification.reminder.interval.hours configured: '{}'. Falling back to 3.0", reminderIntervalHoursStr);
            intervalHours = 3.0;
        }
        long intervalMinutes = Math.max(1, (long) (intervalHours * 60));

        // Get all pending forms with pessimistic write lock (safe for multiple application instances)
        List<FormStatus> pendingStatuses = List.of(FormStatus.PendingDeputyWarden, FormStatus.PendingWarden, FormStatus.PendingOffice);
        List<ReductionForm> pendingForms = reductionFormRepo.findPendingFormsForUpdate(pendingStatuses);

        if (pendingForms.isEmpty()) {
            logger.info("No pending requests found for reminders.");
            return;
        }

        Map<String, List<ReductionForm>> recipientReminders = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (ReductionForm form : pendingForms) {
            List<String> recipients = resolveRecipients(form);
            for (String recipient : recipients) {
                Optional<NotificationReminderLog> logOpt = reminderLogRepo.findByRecipientUsernameAndFormId(recipient, form.getFormId());
                boolean isEligible = false;

                if (logOpt.isPresent()) {
                    NotificationReminderLog log = logOpt.get();
                    if (now.isAfter(log.getLastReminderSentAt().plusMinutes(intervalMinutes))) {
                        isEligible = true;
                    } else {
                        logger.info("Skipping reminder because already sent recently");
                    }
                } else {
                    // First reminder
                    if (now.isAfter(form.getSubmittedAt().plusMinutes(intervalMinutes))) {
                        isEligible = true;
                    }
                }

                if (isEligible) {
                    recipientReminders.computeIfAbsent(recipient, k -> new ArrayList<>()).add(form);
                }
            }
        }

        // Send reminder per recipient
        for (Map.Entry<String, List<ReductionForm>> entry : recipientReminders.entrySet()) {
            String recipient = entry.getKey();
            List<ReductionForm> forms = entry.getValue();
            int count = forms.size();

            logger.info("Found {} pending requests for {}", count, recipient);

            String title = "Pending Approval Reminder";
            String body;
            if (count == 1) {
                body = "You have 1 pending Mess Reduction request waiting for your approval.";
            } else {
                body = "You have " + count + " pending Mess Reduction requests waiting for your approval.";
            }

            String redirectUrl = getRedirectUrl(recipient);

            logger.info("Sending reminder push notification");
            try {
                pushNotificationService.sendPushNotification(recipient, title, body, redirectUrl, -1L);
                logger.info("Reminder push sent successfully");

                // Update logs
                for (ReductionForm form : forms) {
                    NotificationReminderLog log = reminderLogRepo.findByRecipientUsernameAndFormId(recipient, form.getFormId())
                            .orElseGet(() -> {
                                NotificationReminderLog newLog = new NotificationReminderLog();
                                newLog.setRecipientUsername(recipient);
                                newLog.setFormId(form.getFormId());
                                newLog.setReminderCount(0);
                                return newLog;
                            });

                    log.setLastReminderSentAt(now);
                    log.setReminderCount(log.getReminderCount() + 1);
                    reminderLogRepo.save(log);
                }
                logger.info("Updated reminder history");
            } catch (Exception e) {
                logger.error("Failed to send reminder push notification to {}: {}", recipient, e.getMessage());
            }
        }
    }

    private List<String> resolveRecipients(ReductionForm form) {
        if (form.getCurrentStatus() == FormStatus.PendingDeputyWarden) {
            String deputyUsername = form.getAssignedDeputyWarden();
            if (deputyUsername != null) {
                return Collections.singletonList(deputyUsername);
            }
        } else if (form.getCurrentStatus() == FormStatus.PendingWarden) {
            List<String> recipients = new ArrayList<>();
            List<StaffUsers> wardens = staffUsersRepo.findByRole(Role.Warden);
            for (StaffUsers warden : wardens) {
                if ("warden".equalsIgnoreCase(warden.getUserName()) || ("warden" + form.getYear()).equalsIgnoreCase(warden.getUserName())) {
                    recipients.add(warden.getUserName());
                }
            }
            return recipients;
        } else if (form.getCurrentStatus() == FormStatus.PendingOffice) {
            List<String> recipients = new ArrayList<>();
            List<StaffUsers> offices = staffUsersRepo.findByRole(Role.Office);
            for (StaffUsers office : offices) {
                recipients.add(office.getUserName());
            }
            return recipients;
        }
        return Collections.emptyList();
    }

    private String getRedirectUrl(String recipient) {
        if (recipient == null) {
            return "/";
        }
        if ("warden".equalsIgnoreCase(recipient) || recipient.startsWith("warden")) {
            return "/warden";
        }
        if ("office".equalsIgnoreCase(recipient)) {
            return "/office";
        }
        if (recipient.startsWith("deputy")) {
            return "/deputy";
        }
        return "/student-dashboard";
    }
}
