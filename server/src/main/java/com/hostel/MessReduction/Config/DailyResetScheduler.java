package com.hostel.MessReduction.Config;

import com.hostel.MessReduction.Entity.ExtraSubmissionRequest;
import com.hostel.MessReduction.Entity.RequestStatus;
import com.hostel.MessReduction.Repo.ExtraSubmissionRequestRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyResetScheduler {

    private final ExtraSubmissionRequestRepo extraSubmissionRequestRepo;

    @Scheduled(cron = "0 0 0 * * *") // Runs every day at 12:00 AM
    public void resetExtraPermissions() {
        log.info("Running Daily Reset Scheduler for Extra Permissions");
        List<ExtraSubmissionRequest> pendingRequests = extraSubmissionRequestRepo.findByStatus(RequestStatus.PENDING);
        for (ExtraSubmissionRequest req : pendingRequests) {
            // Expire pending requests that were not processed today
            if (req.getCreatedAt().toLocalDate().isBefore(LocalDate.now())) {
                req.setStatus(RequestStatus.REJECTED);
                req.setApprovedBy("System");
                req.setReason(req.getReason() + " [Expired at midnight]");
                extraSubmissionRequestRepo.save(req);
            }
        }
        
        // Note: The dailySubmissionCount reset is handled lazily in ReductionFormService.checkSubmissionLimit
        // This avoids locking the entire StudentDetails table at midnight.
        log.info("Daily Reset Scheduler completed");
    }
}
