package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.*;
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
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AutoAcceptWorkflowTest {

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
    private AutoAcceptSettingsRepo autoAcceptSettingsRepo;

    @Mock
    private AuditLogRepo auditLogRepo;

    private ReductionFormService reductionFormService;
    private StudentDetails student;
    private StaffUsers deputyWarden;

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
                auditLogRepo,
                null
        );

        student = new StudentDetails();
        student.setStudentId(101L);
        student.setName("Auto Accept Student");
        student.setDepartment("CSE");
        student.setGender(Gender.MALE);
        student.setCurrentYear(2);
        student.setDailySubmissionCount(0);
        student.setExtraSubmissionGranted(0);
        student.setEmailId("auto@example.com");

        deputyWarden = new StaffUsers();
        deputyWarden.setUserId(2L);
        deputyWarden.setUserName("deputyWarden2");
        deputyWarden.setRole(Role.DeputyWarden);
        deputyWarden.setGender(Gender.MALE);
        deputyWarden.setYear(2);

        lenient().when(studentDetailsRepo.findById(101L)).thenReturn(Optional.of(student));
        lenient().when(staffUsersRepo.findByRoleAndGenderAndYear(Role.DeputyWarden, Gender.MALE, 2))
                .thenReturn(Optional.of(deputyWarden));
        lenient().when(reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(101L))
                .thenReturn(Collections.emptyList());
    }

    private ReductionFormReqDTO createValidReq() {
        ReductionFormReqDTO req = new ReductionFormReqDTO();
        req.setYear(2);
        req.setRoomNo(205L);
        req.setLeaveDate(LocalDate.now().plusDays(2));
        req.setLeaveTime(LocalTime.of(9, 0));
        req.setArrivalDate(LocalDate.now().plusDays(7));
        req.setArrivalTime(LocalTime.of(18, 0));
        req.setReason("Attending AI Conference");
        return req;
    }

    @Test
    @DisplayName("WF-HAPPY-07: Auto-accept enabled for Deputy Warden automatically transitions submitted form to PendingWarden")
    void testAutoAccept_Enabled_AutomaticallyTransitionsToPendingWarden() {
        AutoAcceptSettings settings = new AutoAcceptSettings();
        settings.setUsername("deputyWarden2");
        settings.setRole("DEPUTY_WARDEN");
        settings.setEnabled(true);
        settings.setFromDate(LocalDate.now().minusDays(1));
        settings.setToDate(LocalDate.now().plusDays(10));
        settings.setDepartment("ALL");
        settings.setYear("ALL");

        when(autoAcceptSettingsRepo.findByUsername("deputyWarden2")).thenReturn(Optional.of(settings));

        ReductionFormReqDTO req = createValidReq();
        ReductionFormResDTO res = reductionFormService.formSubmit(req, 101L);

        // When auto accept is enabled, Deputy stage is automatically approved
        // and the form advances directly to PendingWarden
        assertEquals(FormStatus.PendingWarden, res.getCurrentStatus(), "Form status must automatically advance to PendingWarden");
        verify(reductionFormHistoryRepo, atLeast(2)).save(any(ReductionFormHistory.class));
    }

    @Test
    @DisplayName("WF-STATE-22: Auto-accept disabled leaves submitted form in PendingDeputyWarden stage")
    void testAutoAccept_Disabled_LeavesFormInPendingDeputyWarden() {
        AutoAcceptSettings settings = new AutoAcceptSettings();
        settings.setUsername("deputyWarden2");
        settings.setRole("DEPUTY_WARDEN");
        settings.setEnabled(false); // Disabled

        when(autoAcceptSettingsRepo.findByUsername("deputyWarden2")).thenReturn(Optional.of(settings));

        ReductionFormReqDTO req = createValidReq();
        ReductionFormResDTO res = reductionFormService.formSubmit(req, 101L);

        // Must remain in initial PendingDeputyWarden
        assertEquals(FormStatus.PendingDeputyWarden, res.getCurrentStatus(), "Disabled auto-accept must leave status as PendingDeputyWarden");
    }
}
