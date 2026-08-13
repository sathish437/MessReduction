package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.AppNotificationRepository;
import com.hostel.MessReduction.Repo.NotificationReminderLogRepository;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReminderNotificationService {
    private static final Logger logger = LoggerFactory.getLogger(ReminderNotificationService.class);

    private final ReductionFormRepo reductionFormRepo;
    private final StaffUsersRepo staffUsersRepo;
    private final NotificationReminderLogRepository reminderLogRepo;
    private final PushNotificationService pushNotificationService;
    private final FirebaseNotificationService firebaseNotificationService;
    private final AppNotificationRepository appNotificationRepository;

    @Value("${notification.reminder.enabled:true}")
    private boolean reminderEnabled;

    @Value("${notification.reminder.delay-hours:${notification.reminder.delay.hours:24}}")
    private String reminderDelayHoursStr;

    @Value("${notification.reminder.interval-hours:${notification.reminder.interval.hours:24}}")
    private String reminderIntervalHoursStr;

    public ReminderNotificationService(ReductionFormRepo reductionFormRepo,
                                       StaffUsersRepo staffUsersRepo,
                                       NotificationReminderLogRepository reminderLogRepo,
                                       PushNotificationService pushNotificationService,
                                       FirebaseNotificationService firebaseNotificationService,
                                       AppNotificationRepository appNotificationRepository) {
        this.reductionFormRepo = reductionFormRepo;
        this.staffUsersRepo = staffUsersRepo;
        this.reminderLogRepo = reminderLogRepo;
        this.pushNotificationService = pushNotificationService;
        this.firebaseNotificationService = firebaseNotificationService;
        this.appNotificationRepository = appNotificationRepository;
    }

    public void processReminders() {
        if (!reminderEnabled) {
            logger.info("Reminder notifications are disabled in configuration.");
            return;
        }

        logger.info("Starting Reminder Notification check...");

        double delayHours = parseConfigHours(reminderDelayHoursStr, 24.0, "delay");
        double intervalHours = parseConfigHours(reminderIntervalHoursStr, 24.0, "interval");

        long delayMinutes = Math.max(1, (long) (delayHours * 60));
        long intervalMinutes = Math.max(1, (long) (intervalHours * 60));

        List<FormStatus> pendingStatuses = List.of(FormStatus.PendingDeputyWarden, FormStatus.PendingWarden, FormStatus.PendingOffice);
        List<ReductionForm> pendingForms = reductionFormRepo.findPendingFormsForUpdate(pendingStatuses);

        if (pendingForms == null || pendingForms.isEmpty()) {
            logger.info("No pending requests found for reminders.");
            return;
        }

        // Filter active & non-deleted pending forms
        List<ReductionForm> activePendingForms = pendingForms.stream()
                .filter(f -> f != null && f.isActive() && !f.isDeletedByStudent())
                .filter(f -> isPendingStatus(f.getCurrentStatus()))
                .toList();

        if (activePendingForms.isEmpty()) {
            logger.info("No active eligible pending requests found for reminders.");
            return;
        }

        List<Long> formIds = activePendingForms.stream().map(ReductionForm::getFormId).toList();

        // Batch fetch existing reminder logs to prevent N+1 queries
        List<NotificationReminderLog> existingLogs = reminderLogRepo.findByFormIdIn(formIds);
        Map<String, NotificationReminderLog> logMap = existingLogs.stream()
                .collect(Collectors.toMap(
                        l -> l.getRecipientUsername() + ":" + l.getFormId(),
                        l -> l,
                        (a, b) -> a
                ));

        Map<String, List<ReductionForm>> recipientReminders = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        int skippedRecentCount = 0;
        int skippedGracePeriodCount = 0;

        for (ReductionForm form : activePendingForms) {
            List<String> recipients = resolveRecipients(form);
            for (String recipient : recipients) {
                if (recipient == null || recipient.trim().isEmpty()) {
                    continue;
                }
                String key = recipient + ":" + form.getFormId();
                NotificationReminderLog log = logMap.get(key);
                boolean isEligible = false;

                if (log != null && log.getLastReminderSentAt() != null) {
                    if (now.isAfter(log.getLastReminderSentAt().plusMinutes(intervalMinutes))) {
                        isEligible = true;
                    } else {
                        skippedRecentCount++;
                    }
                } else {
                    LocalDateTime baseTime = form.getSubmittedAt() != null ? form.getSubmittedAt() : now.minusMinutes(delayMinutes);
                    if (now.isAfter(baseTime.plusMinutes(delayMinutes))) {
                        isEligible = true;
                    } else {
                        skippedGracePeriodCount++;
                    }
                }

                if (isEligible) {
                    recipientReminders.computeIfAbsent(recipient, k -> new ArrayList<>()).add(form);
                }
            }
        }

        logger.info("Reminder evaluation complete: {} total pending forms, {} skipped (recent), {} skipped (grace period), {} recipients to notify.",
                activePendingForms.size(), skippedRecentCount, skippedGracePeriodCount, recipientReminders.size());

        for (Map.Entry<String, List<ReductionForm>> entry : recipientReminders.entrySet()) {
            String recipient = entry.getKey();
            List<ReductionForm> forms = entry.getValue();
            int count = forms.size();

            if (count == 0) continue;

            logger.info("Processing {} reminder requests for recipient: {}", count, recipient);

            try {
                String title;
                String body;
                String redirectUrl = getRedirectUrl(recipient, forms);
                String notifType = count == 1 ? "REMINDER" : "BATCH_REMINDER";

                if (count == 1) {
                    ReductionForm singleForm = forms.get(0);
                    String studentName = (singleForm.getStudentDetails() != null && singleForm.getStudentDetails().getName() != null)
                            ? singleForm.getStudentDetails().getName()
                            : ("#" + singleForm.getFormId());
                    title = "Mess Reduction Reminder";
                    body = "Request from " + studentName + " is waiting for your action.";
                } else {
                    title = "Mess Reduction Reminder";
                    body = count + " mess reduction requests are pending your action.";
                }

                // 1. Create In-App Notification
                AppNotification appNotif = new AppNotification();
                appNotif.setRecipientUsername(recipient);
                appNotif.setMessage(body);
                appNotif.setType(notifType);
                appNotif.setRelatedFormId(count == 1 ? forms.get(0).getFormId() : -1L);
                staffUsersRepo.findByUserName(recipient).ifPresent(staff -> {
                    if (staff.getRole() != null) {
                        appNotif.setRecipientRole(staff.getRole().name());
                    }
                });
                appNotificationRepository.save(appNotif);

                // 2. Dispatch Web Push Notification
                Long referenceFormId = count == 1 ? forms.get(0).getFormId() : -1L;
                pushNotificationService.sendPushNotification(recipient, title, body, redirectUrl, referenceFormId);

                // 3. Dispatch FCM Push Notification
                Map<String, String> fcmData = new HashMap<>();
                fcmData.put("type", notifType);
                fcmData.put("url", redirectUrl);
                fcmData.put("count", String.valueOf(count));
                fcmData.put("formId", String.valueOf(referenceFormId));
                fcmData.put("title", title);
                fcmData.put("message", body);
                firebaseNotificationService.sendNotificationToUser(recipient, title, body, fcmData);

                // 4. Update reminder log history in batch
                List<NotificationReminderLog> logsToSave = new ArrayList<>();
                for (ReductionForm form : forms) {
                    String key = recipient + ":" + form.getFormId();
                    NotificationReminderLog log = logMap.get(key);
                    if (log == null) {
                        log = new NotificationReminderLog();
                        log.setRecipientUsername(recipient);
                        log.setFormId(form.getFormId());
                        log.setReminderCount(0);
                    }
                    log.setLastReminderSentAt(now);
                    log.setReminderCount(log.getReminderCount() + 1);
                    logsToSave.add(log);
                }
                reminderLogRepo.saveAll(logsToSave);

                logger.info("Successfully dispatched reminder to recipient: {} (count: {})", recipient, count);
            } catch (Exception e) {
                logger.error("Failed to dispatch reminder notification for recipient {}: {}", recipient, e.getMessage(), e);
            }
        }
    }

    private double parseConfigHours(String rawValue, double defaultVal, String propName) {
        if (rawValue == null || rawValue.trim().isEmpty()) {
            return defaultVal;
        }
        try {
            return Double.parseDouble(rawValue.trim());
        } catch (NumberFormatException e) {
            logger.warn("Invalid reminder {} hours '{}', falling back to {}", propName, rawValue, defaultVal);
            return defaultVal;
        }
    }

    private boolean isPendingStatus(FormStatus status) {
        return status == FormStatus.PendingDeputyWarden || status == FormStatus.PendingWarden || status == FormStatus.PendingOffice;
    }

    private List<String> resolveRecipients(ReductionForm form) {
        if (form.getCurrentStatus() == FormStatus.PendingDeputyWarden) {
            String deputyUsername = form.getAssignedDeputyWarden();
            if (deputyUsername != null && !deputyUsername.trim().isEmpty()) {
                return Collections.singletonList(deputyUsername);
            }
            if (form.getStudentDetails() != null && form.getStudentDetails().getGender() != null && form.getYear() != null) {
                Optional<StaffUsers> dwOpt = staffUsersRepo.findByRoleAndGenderAndYear(Role.DeputyWarden, form.getStudentDetails().getGender(), form.getYear());
                if (dwOpt.isPresent()) {
                    return Collections.singletonList(dwOpt.get().getUserName());
                }
            }
        } else if (form.getCurrentStatus() == FormStatus.PendingWarden) {
            List<String> recipients = new ArrayList<>();
            List<StaffUsers> wardens = staffUsersRepo.findByRole(Role.Warden);
            for (StaffUsers warden : wardens) {
                if ("warden".equalsIgnoreCase(warden.getUserName())
                        || (form.getYear() != null && ("warden" + form.getYear()).equalsIgnoreCase(warden.getUserName()))
                        || (warden.getYear() != null && Objects.equals(warden.getYear(), form.getYear()))) {
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

    private String getRedirectUrl(String recipient, List<ReductionForm> forms) {
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
            if (forms != null && forms.size() == 1 && forms.get(0).getFormId() != null) {
                return "/deputy/request/" + forms.get(0).getFormId();
            }
            return "/deputy";
        }
        return "/student-dashboard";
    }
}

