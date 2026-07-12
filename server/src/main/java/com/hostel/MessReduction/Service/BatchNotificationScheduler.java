package com.hostel.MessReduction.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BatchNotificationScheduler {
    private static final Logger logger = LoggerFactory.getLogger(BatchNotificationScheduler.class);

    private final BatchNotificationService batchNotificationService;

    @Value("${notification.batch.enabled:true}")
    private boolean batchEnabled;

    public BatchNotificationScheduler(BatchNotificationService batchNotificationService) {
        this.batchNotificationService = batchNotificationService;
    }

    @Scheduled(fixedRateString = "#{${notification.batch.interval.minutes:30} * 60 * 1000}")
    public void runBatch() {
        if (!batchEnabled) {
            logger.info("Batch Push Notifications scheduler is disabled.");
            return;
        }
        logger.info("Batch Scheduler Started");
        try {
            batchNotificationService.processBatch();
        } catch (Exception e) {
            logger.error("Error during Batch Scheduler execution: {}", e.getMessage(), e);
        }
    }
}
