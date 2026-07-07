package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.AppNotificationRepository;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.Service.WhatsAppBatchScheduler;
import com.hostel.MessReduction.Service.WhatsAppReminderScheduler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final WhatsAppBatchScheduler batchScheduler;
    private final WhatsAppReminderScheduler reminderScheduler;
    private final ReductionFormRepo formRepo;
    private final StudentDetailsRepo studentRepo;
    private final AppNotificationRepository notifRepo;
    private final StaffUsersRepo staffUsersRepo;

    public TestController(WhatsAppBatchScheduler batchScheduler, WhatsAppReminderScheduler reminderScheduler, 
                          ReductionFormRepo formRepo, StudentDetailsRepo studentRepo, AppNotificationRepository notifRepo, StaffUsersRepo staffUsersRepo) {
        this.batchScheduler = batchScheduler;
        this.reminderScheduler = reminderScheduler;
        this.formRepo = formRepo;
        this.studentRepo = studentRepo;
        this.notifRepo = notifRepo;
        this.staffUsersRepo = staffUsersRepo;
    }

    @GetMapping("/mock-deputywarden4")
    public String createMockRequest() {
        StudentDetails student = studentRepo.findAll().stream().findFirst().orElse(null);
        if (student == null) return "No students found!";

        ReductionForm form = new ReductionForm();
        form.setStudentDetails(student);
        form.setYear(4);
        form.setRoomNo(101L);
        form.setLeaveDate(LocalDate.now().plusDays(1));
        form.setLeaveTime(LocalTime.NOON);
        form.setArrivalDate(LocalDate.now().plusDays(3));
        form.setArrivalTime(LocalTime.NOON);
        form.setPresentDate(LocalDate.now());
        form.setTotalHolidays(2L);
        form.setReason("Testing WhatsApp Notifications");
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setAssignedDeputyWarden("deputywarden4");
        form.setActive(true);
        form.setSubmittedAt(LocalDateTime.now());
        form = formRepo.save(form);

        AppNotification notif = new AppNotification();
        notif.setRecipientUsername("deputywarden4");
        notif.setMessage("New Reduction Request Received");
        notif.setType("NORMAL_REQUEST");
        notif.setRelatedFormId(form.getFormId());
        notif.setWhatsappStatus("PENDING");
        notif.setRecipientRole("DeputyWarden");
        notifRepo.save(notif);

        return "Created mock request ID " + form.getFormId() + " for deputywarden4! Run /api/test/batch to send notification.";
    }

    @GetMapping("/update-phone")
    public String updatePhone() {
        var staffOpt = staffUsersRepo.findByUserName("deputywarden4");
        if (staffOpt.isPresent()) {
            var staff = staffOpt.get();
            staff.setPhoneNo("917708988616");
            staffUsersRepo.save(staff);
            return "Updated phone for deputywarden4 to 917708988616";
        }
        return "Staff not found";
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
