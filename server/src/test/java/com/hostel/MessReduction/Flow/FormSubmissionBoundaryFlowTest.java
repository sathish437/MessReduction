package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.CustomException.DateNotValidException;
import com.hostel.MessReduction.CustomException.StatusAlreadyPendingException;
import com.hostel.MessReduction.CustomException.TotalLeaveDateCountException;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FormSubmissionBoundaryFlowTest {

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
                null,
                null
        );

        student = new StudentDetails();
        student.setStudentId(101L);
        student.setName("Karthik");
        student.setRegisterNo("730421104050");
        student.setGender(Gender.MALE);
        student.setCurrentYear(2);
        student.setDailySubmissionCount(0);
        student.setExtraSubmissionGranted(0);
        student.setLastSubmissionDate(LocalDate.now());

        deputyWarden = new StaffUsers();
        deputyWarden.setUserId(2L);
        deputyWarden.setUserName("deputyWarden2");
        deputyWarden.setRole(Role.DeputyWarden);
        deputyWarden.setGender(Gender.MALE);
        deputyWarden.setYear(2);

        lenient().when(studentDetailsRepo.findById(101L)).thenReturn(Optional.of(student));
        lenient().when(staffUsersRepo.findByRoleAndGenderAndYear(Role.DeputyWarden, Gender.MALE, 2))
                .thenReturn(Optional.of(deputyWarden));
        lenient().when(autoAcceptSettingsRepo.findByUsername(anyString())).thenReturn(Optional.empty());
    }

    private ReductionFormReqDTO createValidReq(int plusDaysLeave, int plusDaysArrival) {
        ReductionFormReqDTO req = new ReductionFormReqDTO();
        req.setYear(2);
        req.setRoomNo(205L);
        req.setLeaveDate(LocalDate.now().plusDays(plusDaysLeave));
        req.setLeaveTime(LocalTime.of(9, 0));
        req.setArrivalDate(LocalDate.now().plusDays(plusDaysArrival));
        req.setArrivalTime(LocalTime.of(18, 0));
        req.setReason("Attending national technical symposium");
        return req;
    }

    @Test
    @DisplayName("WF-BND-01: Exactly 3 submissions permitted per day")
    void testDailySubmissionLimit_ThreeAllowed() {
        when(reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(101L))
                .thenReturn(Collections.emptyList());

        // Submission 1
        ReductionFormReqDTO req1 = createValidReq(1, 6);
        ReductionFormResDTO res1 = reductionFormService.formSubmit(req1, 101L);
        assertNotNull(res1);
        assertEquals(1, student.getDailySubmissionCount());

        // Submission 2
        ReductionFormReqDTO req2 = createValidReq(7, 12);
        ReductionFormResDTO res2 = reductionFormService.formSubmit(req2, 101L);
        assertNotNull(res2);
        assertEquals(2, student.getDailySubmissionCount());

        // Submission 3
        ReductionFormReqDTO req3 = createValidReq(13, 18);
        ReductionFormResDTO res3 = reductionFormService.formSubmit(req3, 101L);
        assertNotNull(res3);
        assertEquals(3, student.getDailySubmissionCount());
    }

    @Test
    @DisplayName("WF-BND-02 & WF-NEG-12: 4th Submission is rejected when limit is 3")
    void testDailySubmissionLimit_FourthRejected() {
        student.setDailySubmissionCount(3);
        when(reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(101L))
                .thenReturn(Collections.emptyList());

        ReductionFormReqDTO req4 = createValidReq(1, 6);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reductionFormService.formSubmit(req4, 101L)
        );
        assertTrue(ex.getMessage().contains("maximum limit of 3"));
    }

    @Test
    @DisplayName("WF-BND-03 & WF-HAPPY-10: 4th Submission succeeds when admin grants 1 extra submission")
    void testDailySubmissionLimit_ExtraGrantedAllowsFourth() {
        student.setDailySubmissionCount(3);
        student.setExtraSubmissionGranted(1); // 3 + 1 = 4 allowed

        when(reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(101L))
                .thenReturn(Collections.emptyList());

        ReductionFormReqDTO req4 = createValidReq(1, 6);
        ReductionFormResDTO res4 = reductionFormService.formSubmit(req4, 101L);

        assertNotNull(res4);
        assertEquals(4, student.getDailySubmissionCount());
    }

    @Test
    @DisplayName("WF-NEG-10 & WF-BND-05: Leave duration <= 3 days rejected (minimum > 3 days rule)")
    void testMinimumDurationRule_RejectedWhenLessThanOrEqualToThreeDays() {
        // Leave for exactly 2 days (duration <= 3)
        ReductionFormReqDTO req = createValidReq(1, 3);

        assertThrows(TotalLeaveDateCountException.class, () ->
                reductionFormService.formSubmit(req, 101L)
        );
    }

    @Test
    @DisplayName("WF-NEG-11: Past leave date submission rejected")
    void testPastLeaveDate_Rejected() {
        ReductionFormReqDTO req = new ReductionFormReqDTO();
        req.setYear(2);
        req.setRoomNo(205L);
        req.setLeaveDate(LocalDate.now().minusDays(1)); // Yesterday
        req.setLeaveTime(LocalTime.of(9, 0));
        req.setArrivalDate(LocalDate.now().plusDays(5));
        req.setArrivalTime(LocalTime.of(18, 0));
        req.setReason("Past date test");

        assertThrows(DateNotValidException.class, () ->
                reductionFormService.formSubmit(req, 101L)
        );
    }

    @Test
    @DisplayName("WF-BND-21: Submitting new form when already having an active non-rejected form rejected")
    void testOverlappingOrExistingActiveForm_Rejected() {
        ReductionForm existingActiveForm = new ReductionForm();
        existingActiveForm.setFormId(200L);
        existingActiveForm.setCurrentStatus(FormStatus.PendingDeputyWarden);
        existingActiveForm.setActive(true);

        when(reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(101L))
                .thenReturn(List.of(existingActiveForm));

        ReductionFormReqDTO req = createValidReq(1, 6);

        assertThrows(StatusAlreadyPendingException.class, () ->
                reductionFormService.formSubmit(req, 101L)
        );
    }
}
