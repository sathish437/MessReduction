package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.Gender;
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

    @GetMapping("/mock-deputywarden2-ten")
    public String createTenMockRequests() {
        StudentDetails student = studentRepo.findAll().stream().findFirst().orElse(null);
        if (student == null) {
            student = new StudentDetails();
            student.setName("Mock Student Year 2");
            student.setRegisterNo("REG_Y2_001");
            student.setRollNo("ROLL_Y2_001");
            student.setDepartment(Department.CSE);
            student.setGender(Gender.MALE);
            student.setDob(LocalDate.of(2005, 5, 15));
            student.setEmailId("student_y2@example.com");
            student.setPhoneNo("917708988616");
            student = studentRepo.save(student);
        }

        StringBuilder responseMsg = new StringBuilder();
        responseMsg.append("Created 10 mock requests for deputyWarden2:\n");

        for (int i = 1; i <= 10; i++) {
            ReductionForm form = new ReductionForm();
            form.setStudentDetails(student);
            form.setYear(2); // deputyWarden2 handles year 2
            form.setRoomNo(200L + i);
            form.setLeaveDate(LocalDate.now().plusDays(i));
            form.setLeaveTime(LocalTime.of(9, 0));
            form.setArrivalDate(LocalDate.now().plusDays(i + 2));
            form.setArrivalTime(LocalTime.of(17, 0));
            form.setPresentDate(LocalDate.now());
            form.setTotalHolidays(2L);
            form.setReason("Mock request #" + i + " for testing Deputy Warden 2 dashboard");
            form.setCurrentStatus(FormStatus.PendingDeputyWarden);
            form.setAssignedDeputyWarden("deputyWarden2");
            form.setActive(true);
            form.setSubmittedAt(LocalDateTime.now().minusMinutes(i * 10));
            form = formRepo.save(form);

            AppNotification notif = new AppNotification();
            notif.setRecipientUsername("deputyWarden2");
            notif.setMessage("New Reduction Request #" + i + " Received");
            notif.setType("NORMAL_REQUEST");
            notif.setRelatedFormId(form.getFormId());
            notif.setWhatsappStatus("PENDING");
            notif.setRecipientRole("DeputyWarden");
            notifRepo.save(notif);

            responseMsg.append("- Form ID: ").append(form.getFormId()).append(", Room: ").append(form.getRoomNo()).append("\n");
        }

        return responseMsg.toString();
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
