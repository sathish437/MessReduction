package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.ReductionFormHistoryRepo;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.Service.ActivityLogService;
import com.hostel.MessReduction.Service.NotificationService;
import com.hostel.MessReduction.Service.ReductionFormService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RejectionLifecycleFlowTest {

    @Mock
    private ReductionFormRepo reductionFormRepo;

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @Mock
    private ReductionFormHistoryRepo reductionFormHistoryRepo;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private StaffUsersRepo staffUsersRepo;

    @Mock
    private com.hostel.MessReduction.Repo.AutoAcceptSettingsRepo autoAcceptSettingsRepo;

    private ReductionFormService reductionFormService;
    private StudentDetails student;
    private StaffUsers warden2;
    private StaffUsers officeUser;

    @BeforeEach
    void setUp() {
        reductionFormService = new ReductionFormService(
                reductionFormRepo,
                studentDetailsRepo,
                reductionFormHistoryRepo,
                activityLogService,
                notificationService,
                staffUsersRepo,
                autoAcceptSettingsRepo,
                null,
                null
        );

        student = new StudentDetails();
        student.setStudentId(101L);
        student.setName("Student Lifecycle");
        student.setEmailId("student@example.com");
        student.setGender(Gender.MALE);
        student.setCurrentYear(2);
        student.setDailySubmissionCount(1);
        student.setExtraSubmissionGranted(0);

        warden2 = new StaffUsers();
        warden2.setUserId(10L);
        warden2.setUserName("warden2");
        warden2.setRole(Role.Warden);
        warden2.setYear(2);

        officeUser = new StaffUsers();
        officeUser.setUserId(30L);
        officeUser.setUserName("officeUser");
        officeUser.setRole(Role.Office);

        lenient().when(studentDetailsRepo.findById(101L)).thenReturn(Optional.of(student));
        lenient().when(staffUsersRepo.findByUserName("warden2")).thenReturn(Optional.of(warden2));
        lenient().when(staffUsersRepo.findByUserName("officeUser")).thenReturn(Optional.of(officeUser));
    }

    @Test
    @DisplayName("WF-ALT-02 & WF-STATE-14: Warden rejection followed by student resubmission resumes at PendingWarden stage")
    void testWardenRejectionAndResubmissionLifecycle() {
        ReductionForm form = new ReductionForm();
        form.setFormId(601L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingWarden);
        form.setYear(2);
        form.setAssignedDeputyWarden("deputyWarden2");
        form.setStudentDetails(student);
        form.setResubmissionCount(0);

        when(reductionFormRepo.findById(601L)).thenReturn(Optional.of(form));
        when(reductionFormRepo.findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(601L, 101L))
                .thenReturn(Optional.of(form));

        // 1. Warden rejects the form with a reason
        reductionFormService.rejectWardenForm(601L, "Discrepancy in leave dates", "warden2");

        assertEquals(FormStatus.RejectedWarden, form.getCurrentStatus());
        assertEquals("Discrepancy in leave dates", form.getRejectReason());

        // 2. Student resubmits the corrected form
        ReductionFormReqDTO resubmitDTO = new ReductionFormReqDTO();
        resubmitDTO.setYear(2);
        resubmitDTO.setRoomNo(202L);
        resubmitDTO.setLeaveDate(LocalDate.now().plusDays(2));
        resubmitDTO.setLeaveTime(LocalTime.of(10, 0));
        resubmitDTO.setToDate(LocalDate.now().plusDays(7));
        resubmitDTO.setArrivalDate(LocalDate.now().plusDays(8));
        resubmitDTO.setArrivalTime(LocalTime.of(18, 0));
        resubmitDTO.setReason("Corrected attendance dates");

        ReductionFormResDTO response = reductionFormService.resubmitForm(601L, 101L, resubmitDTO);

        // Verify lifecycle postconditions:
        // Status resumes directly at PendingWarden, NOT resetting to Deputy Warden
        assertEquals(FormStatus.PendingWarden, response.getCurrentStatus());
        assertEquals(1, form.getResubmissionCount(), "resubmissionCount must increment to 1");
        assertNull(form.getRejectReason(), "rejectReason must be cleared upon resubmission");
        assertEquals(FormStatus.RejectedWarden, form.getRejectedStage(), "rejectedStage must record previous rejection");
        assertEquals(FormStatus.PendingWarden, form.getResumeStage(), "resumeStage must be PendingWarden");
        verify(reductionFormRepo, atLeastOnce()).save(form);
    }

    @Test
    @DisplayName("WF-ALT-03 & WF-STATE-15: Office rejection followed by student resubmission resumes at PendingOffice stage")
    void testOfficeRejectionAndResubmissionLifecycle() {
        ReductionForm form = new ReductionForm();
        form.setFormId(602L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingOffice);
        form.setYear(2);
        form.setAssignedDeputyWarden("deputyWarden2");
        form.setStudentDetails(student);
        form.setResubmissionCount(1);

        when(reductionFormRepo.findById(602L)).thenReturn(Optional.of(form));
        when(reductionFormRepo.findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(602L, 101L))
                .thenReturn(Optional.of(form));

        // 1. Office rejects the form
        reductionFormService.rejectOfficeForm(602L, "Fee dues not cleared", "officeUser");

        assertEquals(FormStatus.RejectedOffice, form.getCurrentStatus());
        assertEquals("Fee dues not cleared", form.getRejectReason());

        // 2. Student resubmits after paying dues
        ReductionFormReqDTO resubmitDTO = new ReductionFormReqDTO();
        resubmitDTO.setYear(2);
        resubmitDTO.setRoomNo(202L);
        resubmitDTO.setLeaveDate(LocalDate.now().plusDays(3));
        resubmitDTO.setLeaveTime(LocalTime.of(9, 0));
        resubmitDTO.setToDate(LocalDate.now().plusDays(8));
        resubmitDTO.setArrivalDate(LocalDate.now().plusDays(9));
        resubmitDTO.setArrivalTime(LocalTime.of(19, 0));
        resubmitDTO.setReason("Dues cleared at cashier office");

        ReductionFormResDTO response = reductionFormService.resubmitForm(602L, 101L, resubmitDTO);

        // Verify lifecycle postconditions:
        // Status resumes directly at PendingOffice, NOT restarting from beginning
        assertEquals(FormStatus.PendingOffice, response.getCurrentStatus());
        assertEquals(2, form.getResubmissionCount(), "resubmissionCount must increment to 2");
        assertNull(form.getRejectReason(), "rejectReason must be cleared");
        assertEquals(FormStatus.RejectedOffice, form.getRejectedStage());
        assertEquals(FormStatus.PendingOffice, form.getResumeStage());
        verify(reductionFormRepo, atLeastOnce()).save(form);
    }

    @Test
    @DisplayName("WF-ALT-04 & WF-STATE-13: Deputy Warden rejection followed by student resubmission resumes at PendingDeputyWarden stage")
    void testDeputyWardenRejectionAndResubmissionLifecycle() {
        ReductionForm form = new ReductionForm();
        form.setFormId(603L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setYear(2);
        form.setAssignedDeputyWarden("deputyWarden2");
        form.setStudentDetails(student);
        form.setResubmissionCount(0);

        when(reductionFormRepo.findById(603L)).thenReturn(Optional.of(form));
        when(reductionFormRepo.findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(603L, 101L))
                .thenReturn(Optional.of(form));

        // 1. Deputy Warden rejects the form
        reductionFormService.rejectDeputyWardenForm(603L, "Room number discrepancy", "deputyWarden2");

        assertEquals(FormStatus.RejectedDeputyWarden, form.getCurrentStatus());
        assertEquals("Room number discrepancy", form.getRejectReason());

        // 2. Student resubmits the corrected form
        ReductionFormReqDTO resubmitDTO = new ReductionFormReqDTO();
        resubmitDTO.setYear(2);
        resubmitDTO.setRoomNo(205L); // Corrected room number
        resubmitDTO.setLeaveDate(LocalDate.now().plusDays(2));
        resubmitDTO.setLeaveTime(LocalTime.of(9, 0));
        resubmitDTO.setToDate(LocalDate.now().plusDays(7));
        resubmitDTO.setArrivalDate(LocalDate.now().plusDays(8));
        resubmitDTO.setArrivalTime(LocalTime.of(18, 0));
        resubmitDTO.setReason("Corrected room number 205");

        ReductionFormResDTO response = reductionFormService.resubmitForm(603L, 101L, resubmitDTO);

        // Verify lifecycle postconditions:
        assertEquals(FormStatus.PendingDeputyWarden, response.getCurrentStatus());
        assertEquals(1, form.getResubmissionCount(), "resubmissionCount must increment to 1");
        assertNull(form.getRejectReason(), "rejectReason must be cleared upon resubmission");
        assertEquals(FormStatus.RejectedDeputyWarden, form.getRejectedStage());
        assertEquals(FormStatus.PendingDeputyWarden, form.getResumeStage());
        verify(reductionFormRepo, atLeastOnce()).save(form);
    }
}
