package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.Service.WhatsAppBatchScheduler;
import com.hostel.MessReduction.Service.WhatsAppReminderScheduler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final WhatsAppBatchScheduler batchScheduler;
    private final WhatsAppReminderScheduler reminderScheduler;

    public TestController(WhatsAppBatchScheduler batchScheduler, WhatsAppReminderScheduler reminderScheduler) {
        this.batchScheduler = batchScheduler;
        this.reminderScheduler = reminderScheduler;
    }

    @GetMapping("/batch")
    public String triggerBatch() {
        batchScheduler.processBatchNotifications();
        return "Batch triggered!";
    }

    @GetMapping("/reminder")
    public String triggerReminder() {
        reminderScheduler.processReminders();
        return "Reminder triggered!";
    }
}
