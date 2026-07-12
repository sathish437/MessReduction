package com.hostel.MessReduction.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReminderNotificationScheduler {
    private static final Logger logger = LoggerFactory.getLogger(ReminderNotificationScheduler.class);

    private final ReminderNotificationService reminderService;

    @Value("${notification.reminder.enabled:true}")
    private boolean reminderEnabled;

    public ReminderNotificationScheduler(ReminderNotificationService reminderService) {
        this.reminderService = reminderService;
    }

    @Scheduled(fixedRate = 60000)
    public void runReminderCheck() {
        if (!reminderEnabled) {
            return;
        }
        try {
            reminderService.processReminders();
        } catch (Exception e) {
            logger.error("Error during Reminder Scheduler execution: {}", e.getMessage(), e);
        }
    }
}
