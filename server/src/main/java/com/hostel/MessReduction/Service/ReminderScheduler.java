package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional
public class ReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ReminderScheduler.class);

    // Testing Mode configuration
    private static final boolean TESTING_MODE = true;

    private final ReductionFormRepo reductionFormRepo;
    private final NotificationService notificationService;
    private final StaffUsersRepo staffUsersRepo;
    private final com.hostel.MessReduction.Repo.ReductionFormHistoryRepo reductionFormHistoryRepo;

    public ReminderScheduler(ReductionFormRepo reductionFormRepo,
                             NotificationService notificationService,
                             StaffUsersRepo staffUsersRepo,
                             com.hostel.MessReduction.Repo.ReductionFormHistoryRepo reductionFormHistoryRepo) {
        this.reductionFormRepo = reductionFormRepo;
        this.notificationService = notificationService;
        this.staffUsersRepo = staffUsersRepo;
        this.reductionFormHistoryRepo = reductionFormHistoryRepo;
    }

    // Runs every 1 minute
    @Scheduled(fixedRate = 60000)
    public void processEmergencyEscalations() {
        // No-op: emergency requests removed
    }

    // 30-Minute Summary Notification Scheduler
    @Scheduled(fixedRate = 1800000)
    public void sendSummaryNotifications() {
        if (TESTING_MODE) return;

        List<FormStatus> pendingStatuses = List.of(FormStatus.PendingWarden, FormStatus.PendingDeputyWarden, FormStatus.PendingOffice);
        List<ReductionForm> pendingForms = reductionFormRepo.findByCurrentStatusIn(pendingStatuses);
        LocalDateTime now = LocalDateTime.now();

        // Filter out forms that already received a summary
        List<ReductionForm> formsToSummarize = pendingForms.stream()
                .filter(f -> f.getLastSummarySentAt() == null)
                .collect(Collectors.toList());

        if (formsToSummarize.isEmpty()) return;

        sendAggregatedAlerts(formsToSummarize, "Pending Requests Summary", "SUMMARY", false);

        for (ReductionForm form : formsToSummarize) {
            form.setLastSummarySentAt(now);
            reductionFormRepo.save(form);
        }
        logger.info("Sent 30-minute summary for {} forms.", formsToSummarize.size());
    }

    // 3-Hour Reminder Notification Scheduler
    @Scheduled(fixedRate = 10800000)
    public void sendReminderNotifications() {
        if (TESTING_MODE) return;

        List<FormStatus> pendingStatuses = List.of(FormStatus.PendingWarden, FormStatus.PendingDeputyWarden, FormStatus.PendingOffice);
        List<ReductionForm> pendingForms = reductionFormRepo.findByCurrentStatusIn(pendingStatuses);
        LocalDateTime now = LocalDateTime.now();

        // Include all forms that are pending where last reminder was null or > 3 hours ago
        List<ReductionForm> formsToRemind = pendingForms.stream()
                .filter(f -> {
                    if (f.getLastReminderSentAt() == null) {
                        return ChronoUnit.HOURS.between(f.getSubmittedAt(), now) >= 3;
                    } else {
                        return ChronoUnit.HOURS.between(f.getLastReminderSentAt(), now) >= 3;
                    }
                })
                .collect(Collectors.toList());

        if (formsToRemind.isEmpty()) return;

        sendAggregatedAlerts(formsToRemind, "Reminder: Pending Requests Awaiting Action", "REMINDER", true);

        for (ReductionForm form : formsToRemind) {
            form.setLastReminderSentAt(now);
            reductionFormRepo.save(form);
        }
        logger.info("Sent 3-hour reminder for {} forms.", formsToRemind.size());
    }

    private void sendAggregatedAlerts(List<ReductionForm> forms, String headerTitle, String type, boolean isReminder) {
        // Group by Role
        Map<Role, List<ReductionForm>> groupedForms = forms.stream()
                .collect(Collectors.groupingBy(f -> getTargetRole(f.getCurrentStatus())));

        for (Map.Entry<Role, List<ReductionForm>> entry : groupedForms.entrySet()) {
            Role role = entry.getKey();
            List<ReductionForm> roleForms = entry.getValue();

            if (role == null || roleForms.isEmpty()) continue;

            // Generate aggregated message for in-app / push
            StringBuilder messageText = new StringBuilder();
            messageText.append(headerTitle).append(" [").append(role.name()).append("]\n\n");
            messageText.append("Total Pending Requests: ").append(roleForms.size()).append("\n\n");
            for (ReductionForm form : roleForms) {
                String studentName = (form.getStudentDetails() != null) ? form.getStudentDetails().getName() : "N/A";
                messageText.append("#").append(form.getFormId()).append(" - ").append(studentName).append("\n");
            }
            messageText.append("\nPlease review pending requests.");

            // Send to respective staff members
            List<StaffUsers> staffList = staffUsersRepo.findByRole(role);
            for (StaffUsers staff : staffList) {
                // If Warden, we technically could have requests for different years. 
                // We'll filter the list for just this warden's year.
                List<ReductionForm> staffSpecificForms = roleForms;
                if (role == Role.Warden) {
                    staffSpecificForms = roleForms.stream()
                            .filter(f -> staff.getUserName().equalsIgnoreCase("warden" + f.getYear()))
                            .collect(Collectors.toList());
                }

                if (staffSpecificForms.isEmpty()) continue;

                // Send In-App / Push Notification
                // Re-build message if staffSpecificForms is subset
                if (role == Role.Warden) {
                    StringBuilder wMsg = new StringBuilder();
                    wMsg.append(headerTitle).append("\n\nTotal Pending Requests: ").append(staffSpecificForms.size()).append("\n\n");
                    for (ReductionForm form : staffSpecificForms) {
                        String studentName = (form.getStudentDetails() != null) ? form.getStudentDetails().getName() : "N/A";
                        wMsg.append("#").append(form.getFormId()).append(" - ").append(studentName).append("\n");
                    }
                    wMsg.append("\nPlease review pending requests.");
                    notificationService.createAggregatedNotification(staff.getUserName(), wMsg.toString(), type);
                } else {
                    notificationService.createAggregatedNotification(staff.getUserName(), messageText.toString(), type);
                }
            }
        }
    }

    private void sendNotificationToApprover(ReductionForm form, String type, boolean isEscalation) {
        Role targetRole = getTargetRole(form.getCurrentStatus());
        if (targetRole == null) return;

        List<StaffUsers> staffList = staffUsersRepo.findByRole(targetRole);
        for (StaffUsers staff : staffList) {
            if (targetRole == Role.Warden) {
                String expectedUsername = "warden" + form.getYear();
                if (!staff.getUserName().equalsIgnoreCase(expectedUsername)) {
                    continue;
                }
            }

            String studentName = (form.getStudentDetails() != null) ? form.getStudentDetails().getName() : "N/A";
            String notifMessage = isEscalation
                    ? "🚨 ESCALATION: Request #" + form.getFormId() + " from " + studentName + " has been pending for over " + ChronoUnit.HOURS.between(form.getSubmittedAt(), LocalDateTime.now()) + " hour(s). Immediate action required!"
                    : "⏰ Reminder: Request #" + form.getFormId() + " from " + studentName + " is still awaiting your approval.";

            String notifType = isEscalation ? "ESCALATION" : "REMINDER";
            notificationService.createNotification(staff.getUserName(), notifMessage, notifType, form.getFormId());
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
