package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.CustomException.DateNotValidException;
import com.hostel.MessReduction.CustomException.TotalLeaveDateCountException;
import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.AutoAcceptSettingsRepo;
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
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DateValidationBoundaryTest {

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
        student.setName("Student DateValidation");
        student.setGender(Gender.MALE);
        student.setCurrentYear(2);
        student.setDailySubmissionCount(0);
        student.setExtraSubmissionGranted(0);

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

    private ReductionFormReqDTO createBaseDTO() {
        ReductionFormReqDTO dto = new ReductionFormReqDTO();
        dto.setYear(2);
        dto.setRoomNo(202L);
        dto.setLeaveTime(LocalTime.of(9, 0));
        dto.setArrivalTime(LocalTime.of(18, 0));
        dto.setReason("Date Validation Boundary Verification");
        return dto;
    }

    @Test
    @DisplayName("WF-NEG-09: Arrival date < leave date is rejected with TotalLeaveDateCountException or DateNotValidException")
    void testArrivalBeforeLeaveDate_Rejected() {
        ReductionFormReqDTO dto = createBaseDTO();
        dto.setLeaveDate(LocalDate.now().plusDays(10));
        dto.setArrivalDate(LocalDate.now().plusDays(5)); // Arrival before leave

        assertThrows(TotalLeaveDateCountException.class, () ->
                reductionFormService.formSubmit(dto, 101L)
        );
    }

    @Test
    @DisplayName("WF-NEG-11: Past leave date is rejected with DateNotValidException")
    void testPastLeaveDate_Rejected() {
        ReductionFormReqDTO dto = createBaseDTO();
        dto.setLeaveDate(LocalDate.now().minusDays(2)); // Past
        dto.setArrivalDate(LocalDate.now().plusDays(5));

        DateNotValidException ex = assertThrows(DateNotValidException.class, () ->
                reductionFormService.formSubmit(dto, 101L)
        );
        assertTrue(ex.getMessage().contains("cannot be before today"));
    }

    @Test
    @DisplayName("WF-BND-05: Equal leaveDate and arrivalDate (0 days) is rejected")
    void testEqualLeaveAndArrivalDate_Rejected() {
        ReductionFormReqDTO dto = createBaseDTO();
        LocalDate futureDate = LocalDate.now().plusDays(5);
        dto.setLeaveDate(futureDate);
        dto.setArrivalDate(futureDate); // Same day (0 days)

        assertThrows(TotalLeaveDateCountException.class, () ->
                reductionFormService.formSubmit(dto, 101L)
        );
    }

    @Test
    @DisplayName("WF-BND-08: toDate before leaveDate is rejected with DateNotValidException")
    void testToDateBeforeLeaveDate_Rejected() {
        ReductionFormReqDTO dto = createBaseDTO();
        dto.setLeaveDate(LocalDate.now().plusDays(10));
        dto.setToDate(LocalDate.now().plusDays(8)); // toDate before leaveDate
        dto.setArrivalDate(LocalDate.now().plusDays(15));

        DateNotValidException ex = assertThrows(DateNotValidException.class, () ->
                reductionFormService.formSubmit(dto, 101L)
        );
        assertTrue(ex.getMessage().contains("To Date cannot be before From Date"));
    }

    @Test
    @DisplayName("WF-BND-09: arrivalDate before toDate is rejected with DateNotValidException")
    void testArrivalDateBeforeToDate_Rejected() {
        ReductionFormReqDTO dto = createBaseDTO();
        dto.setLeaveDate(LocalDate.now().plusDays(5));
        dto.setToDate(LocalDate.now().plusDays(12));
        dto.setArrivalDate(LocalDate.now().plusDays(10)); // arrival < toDate

        DateNotValidException ex = assertThrows(DateNotValidException.class, () ->
                reductionFormService.formSubmit(dto, 101L)
        );
        assertTrue(ex.getMessage().contains("Arrival Date must be greater than or equal to To Date"));
    }

    @Test
    @DisplayName("WF-BND-07: Leap year boundary handling (February 29 calculation)")
    void testLeapYearBoundary_CalculatesCorrectDays() {
        ReductionFormReqDTO dto = createBaseDTO();
        // Leap year 2028: Feb 26 to March 2 (Feb 26, 27, 28, 29, Mar 1, Mar 2 -> 5 days)
        LocalDate leapFeb = LocalDate.of(2028, 2, 26);
        LocalDate march = LocalDate.of(2028, 3, 2);

        dto.setLeaveDate(leapFeb);
        dto.setArrivalDate(march);

        // When dates are in the future relative to today, chrono unit calculation includes Feb 29
        long days = java.time.temporal.ChronoUnit.DAYS.between(leapFeb, march);
        assertEquals(5, days, "2028 Leap year must count Feb 29 correctly as 5 days total");

        var response = reductionFormService.formSubmit(dto, 101L);
        assertNotNull(response);
        // Mess reduction leaves = 5 - 3 = 2 days
        assertEquals(2, response.getTotalHolidays());
    }
}
