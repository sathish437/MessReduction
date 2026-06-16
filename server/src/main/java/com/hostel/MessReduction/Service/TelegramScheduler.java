package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TelegramScheduler {

    private static final Logger logger = LoggerFactory.getLogger(TelegramScheduler.class);
    
    private final ReductionFormRepo reductionFormRepo;
    private final TelegramNotificationService telegramNotificationService;

    public TelegramScheduler(ReductionFormRepo reductionFormRepo, TelegramNotificationService telegramNotificationService) {
        this.reductionFormRepo = reductionFormRepo;
        this.telegramNotificationService = telegramNotificationService;
    }

    // Runs every 30 minutes (1,800,000 ms)
    @Scheduled(fixedRate = 1800000)
    public void sendPendingRequestsSummary() {
        List<ReductionForm> allPending = reductionFormRepo.findByCurrentStatusIn(List.of(
                FormStatus.PendingWarden,
                FormStatus.PendingDeputyWarden,
                FormStatus.PendingOffice
        ));

        // Filter to only include requests that haven't been summarized yet (Avoid duplicates)
        List<ReductionForm> newPendingForms = allPending.stream()
                .filter(form -> form.getLastSummarySentAt() == null)
                .collect(Collectors.toList());

        if (newPendingForms.isEmpty()) {
            return;
        }

        StringBuilder message = new StringBuilder("🍽️ HOSTEL MESS REDUCTION\n\n");
        message.append("Pending Requests Summary\n\n");
        message.append("Total Pending Requests: ").append(newPendingForms.size()).append("\n\n");

        for (ReductionForm form : newPendingForms) {
            message.append("#").append(form.getFormId()).append(" - ").append(form.getStudentDetails().getName()).append("\n");
            form.setLastSummarySentAt(LocalDateTime.now());
        }

        message.append("\nPlease review pending requests.");

        telegramNotificationService.sendGroupNotification(message.toString());
        reductionFormRepo.saveAll(newPendingForms);
        
        logger.info("Summary Notification Sent. Pending Request Count: {}", newPendingForms.size());
    }

    // Runs every 3 hours (10,800,000 ms)
    @Scheduled(fixedRate = 10800000)
    public void sendPendingRequestsReminder() {
        List<ReductionForm> allPending = reductionFormRepo.findByCurrentStatusIn(List.of(
                FormStatus.PendingWarden,
                FormStatus.PendingDeputyWarden,
                FormStatus.PendingOffice
        ));

        LocalDateTime now = LocalDateTime.now();

        // Filter requests that are at least 3 hours old
        List<ReductionForm> reminderForms = allPending.stream()
                .filter(form -> {
                    long hoursElapsed = ChronoUnit.HOURS.between(form.getSubmittedAt(), now);
                    return hoursElapsed >= 3;
                })
                .collect(Collectors.toList());

        if (reminderForms.isEmpty()) {
            return;
        }

        StringBuilder message = new StringBuilder("⏰ REMINDER\n\n");
        message.append("Pending Requests Awaiting Action\n\n");

        for (ReductionForm form : reminderForms) {
            message.append("#").append(form.getFormId()).append(" - ").append(formatStatus(form.getCurrentStatus())).append("\n");
            // Maintain tracking fields
            form.setLastReminderSentAt(now); 
        }

        message.append("\nPlease take action.");

        telegramNotificationService.sendGroupNotification(message.toString());
        reductionFormRepo.saveAll(reminderForms);

        logger.info("Reminder Notification Sent. Pending Request Count: {}", reminderForms.size());
    }

    private String formatStatus(FormStatus status) {
        switch (status) {
            case PendingWarden: return "Pending Warden";
            case PendingDeputyWarden: return "Pending Deputy Warden";
            case PendingOffice: return "Pending Office";
            default: return status.name();
        }
    }
}
