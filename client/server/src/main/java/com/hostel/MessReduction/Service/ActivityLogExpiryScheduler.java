package com.hostel.MessReduction.Service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ActivityLogExpiryScheduler {

    private final ActivityLogService activityLogService;

    public ActivityLogExpiryScheduler(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void expireLogs() {
        activityLogService.expireLogs();
    }
}
