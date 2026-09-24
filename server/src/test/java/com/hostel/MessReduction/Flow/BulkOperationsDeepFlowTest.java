package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.CustomException.ReductionFormNotFoundException;
import com.hostel.MessReduction.DTO.ResDTO.BulkRejectSummaryDTO;
import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.ReductionFormHistoryRepo;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BulkOperationsDeepFlowTest {

    @Mock
    private ReductionFormRepo reductionFormRepo;

    @Mock
    private ReductionFormHistoryRepo reductionFormHistoryRepo;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private StaffUsersRepo staffUsersRepo;

    private ReductionFormService reductionFormService;

    private StaffUsers warden2;
    private StaffUsers deputyWarden2;

    @BeforeEach
    void setUp() {
        reductionFormService = new ReductionFormService(
                reductionFormRepo,
                null,
                reductionFormHistoryRepo,
                activityLogService,
                notificationService,
                staffUsersRepo,
                null,
                null,
                null
        );

        warden2 = new StaffUsers();
        warden2.setUserId(10L);
        warden2.setUserName("warden2");
        warden2.setRole(Role.Warden);
        warden2.setYear(2);

        deputyWarden2 = new StaffUsers();
        deputyWarden2.setUserId(20L);
        deputyWarden2.setUserName("deputyWarden2");
        deputyWarden2.setRole(Role.DeputyWarden);
        deputyWarden2.setYear(2);

        lenient().when(staffUsersRepo.findByUserName("warden2")).thenReturn(Optional.of(warden2));
        lenient().when(staffUsersRepo.findByUserName("deputyWarden2")).thenReturn(Optional.of(deputyWarden2));
    }

    private ReductionForm createForm(Long id, FormStatus status, int year, String deputy) {
        StudentDetails student = new StudentDetails();
        student.setStudentId(id + 1000);
        student.setName("Student " + id);
        student.setEmailId("student" + id + "@example.com");
        student.setDepartment("CSE");

        ReductionForm form = new ReductionForm();
        form.setFormId(id);
        form.setCurrentStatus(status);
        form.setYear(year);
        form.setAssignedDeputyWarden(deputy);
        form.setActive(true);
        form.setStudentDetails(student);
        form.setArrivalDate(LocalDate.now().plusDays(5));
        return form;
    }

    @Test
    @DisplayName("WF-HAPPY-04 & WF-BND-22: Valid bulk approval updates status and records batch history")
    void testValidBulkApproval_Warden() {
        ReductionForm f1 = createForm(1L, FormStatus.PendingWarden, 2, "deputyWarden2");
        ReductionForm f2 = createForm(2L, FormStatus.PendingWarden, 2, "deputyWarden2");

        when(reductionFormRepo.findByFormIdIn(List.of(1L, 2L))).thenReturn(List.of(f1, f2));
        when(reductionFormRepo.bulkUpdateWardenStatusWithYear(anyList(), eq(FormStatus.PendingWarden), eq(FormStatus.PendingOffice), eq(2)))
                .thenReturn(2);

        reductionFormService.updateWardenBulkStatus(List.of(1L, 2L), "Approve", "warden2");

        verify(reductionFormRepo, times(1)).bulkUpdateWardenStatusWithYear(List.of(1L, 2L), FormStatus.PendingWarden, FormStatus.PendingOffice, 2);
        verify(reductionFormHistoryRepo, times(1)).saveAll(anyList());
        verify(activityLogService, times(1)).createLogs(anyList());
        verify(notificationService, times(1)).createNotificationsBatch(anyList());
    }

    @Test
    @DisplayName("WF-HAPPY-05 & WF-BND-23: Valid bulk rejection for Warden returns accurate summary count")
    void testValidBulkRejection_Warden() {
        ReductionForm f1 = createForm(1L, FormStatus.PendingWarden, 2, "deputyWarden2");
        ReductionForm f2 = createForm(2L, FormStatus.PendingWarden, 2, "deputyWarden2");

        when(reductionFormRepo.findByFormIdIn(List.of(1L, 2L))).thenReturn(List.of(f1, f2));
        when(reductionFormRepo.bulkRejectWardenStatusWithYear(anyList(), eq(FormStatus.PendingWarden), eq(FormStatus.RejectedWarden), anyString(), eq(2)))
                .thenReturn(2);

        BulkRejectSummaryDTO summary = reductionFormService.rejectWardenBulk(List.of(1L, 2L), "Invalid attendance credentials", "warden2");

        assertEquals(2, summary.getSelected());
        assertEquals(2, summary.getRejected());
        assertEquals(0, summary.getFailed());
        verify(reductionFormRepo, times(1)).bulkRejectWardenStatusWithYear(anyList(), any(), any(), any(), eq(2));
    }

    @Test
    @DisplayName("WF-NEG-18: Bulk approval with duplicate IDs deduplicates transparently")
    void testBulkApproval_DuplicateIdsDeduplicated() {
        ReductionForm f1 = createForm(1L, FormStatus.PendingWarden, 2, "deputyWarden2");

        // Input contains duplicate ID [1L, 1L]
        when(reductionFormRepo.findByFormIdIn(List.of(1L))).thenReturn(List.of(f1));
        when(reductionFormRepo.bulkUpdateWardenStatusWithYear(anyList(), any(), any(), eq(2))).thenReturn(1);

        reductionFormService.updateWardenBulkStatus(Arrays.asList(1L, 1L), "Approve", "warden2");

        verify(reductionFormRepo, times(1)).findByFormIdIn(List.of(1L));
        verify(reductionFormRepo, times(1)).bulkUpdateWardenStatusWithYear(List.of(1L), FormStatus.PendingWarden, FormStatus.PendingOffice, 2);
    }

    @Test
    @DisplayName("WF-NEG-19: Bulk approval with non-existent ID throws ReductionFormNotFoundException")
    void testBulkApproval_NonExistentIdThrowsNotFound() {
        ReductionForm f1 = createForm(1L, FormStatus.PendingWarden, 2, "deputyWarden2");

        // Requested 1L and 999L, but repo only returns 1L
        when(reductionFormRepo.findByFormIdIn(List.of(1L, 999L))).thenReturn(List.of(f1));

        assertThrows(ReductionFormNotFoundException.class, () ->
                reductionFormService.updateWardenBulkStatus(List.of(1L, 999L), "Approve", "warden2")
        );
    }

    @Test
    @DisplayName("WF-NEG-20 & WF-ABU-16: Bulk reject skips out-of-scope, wrong-state, and wrong-year forms")
    void testBulkReject_MixedValidAndInvalidForms_ReportsAccurateFailureCount() {
        ReductionForm valid = createForm(1L, FormStatus.PendingWarden, 2, "deputyWarden2");
        ReductionForm wrongStatus = createForm(2L, FormStatus.PendingOffice, 2, "deputyWarden2"); // Already processed
        ReductionForm wrongYear = createForm(3L, FormStatus.PendingWarden, 3, "deputyWarden3"); // Year 3 instead of 2

        when(reductionFormRepo.findByFormIdIn(List.of(1L, 2L, 3L))).thenReturn(List.of(valid, wrongStatus, wrongYear));
        when(reductionFormRepo.bulkRejectWardenStatusWithYear(anyList(), any(), any(), any(), eq(2))).thenReturn(1);

        BulkRejectSummaryDTO summary = reductionFormService.rejectWardenBulk(List.of(1L, 2L, 3L), "Bulk rejection test", "warden2");

        // Total 3 requested: 1 succeeded, 2 skipped (wrong status + wrong year)
        assertEquals(3, summary.getSelected());
        assertEquals(1, summary.getRejected());
        assertEquals(2, summary.getFailed());
    }

    @Test
    @DisplayName("WF-ABU-14: Deputy bulk approval skips forms assigned to other Deputy Wardens")
    void testDeputyBulkApproval_SkipsOutOfScopeAssignedForms() {
        ReductionForm myForm = createForm(1L, FormStatus.PendingDeputyWarden, 2, "deputyWarden2");
        ReductionForm otherForm = createForm(2L, FormStatus.PendingDeputyWarden, 2, "deputyWarden6"); // Other deputy

        when(reductionFormRepo.findByFormIdIn(List.of(1L, 2L))).thenReturn(List.of(myForm, otherForm));
        when(reductionFormRepo.bulkUpdateDeputyWardenStatus(anyList(), any(), any(), eq("deputyWarden2"))).thenReturn(1);

        reductionFormService.updateDeputyWardenPendingBulkStatus(List.of(1L, 2L), "Approve", "deputyWarden2");

        // Only myForm (1L) should be updated
        verify(reductionFormRepo, times(1)).bulkUpdateDeputyWardenStatus(List.of(1L), FormStatus.PendingDeputyWarden, FormStatus.PendingWarden, "deputyWarden2");
    }

    @Test
    @DisplayName("WF-HAPPY-04 & WF-BND-22: Valid bulk approval for Office updates status to Approved and batch creates logs")
    void testValidBulkApproval_Office() {
        StaffUsers officeUser = new StaffUsers();
        officeUser.setUserId(30L);
        officeUser.setUserName("officeUser");
        officeUser.setRole(Role.Office);
        lenient().when(staffUsersRepo.findByUserName("officeUser")).thenReturn(Optional.of(officeUser));

        ReductionForm f1 = createForm(1L, FormStatus.PendingOffice, 2, "deputyWarden2");
        ReductionForm f2 = createForm(2L, FormStatus.PendingOffice, 3, "deputyWarden3");

        when(reductionFormRepo.findByFormIdIn(List.of(1L, 2L))).thenReturn(List.of(f1, f2));
        when(reductionFormRepo.bulkUpdateOfficeStatus(List.of(1L, 2L), FormStatus.PendingOffice, FormStatus.Approved))
                .thenReturn(2);

        reductionFormService.updateOfficePendingBulkStatus(List.of(1L, 2L), "Approve", "officeUser");

        verify(reductionFormRepo, times(1)).bulkUpdateOfficeStatus(List.of(1L, 2L), FormStatus.PendingOffice, FormStatus.Approved);
        verify(reductionFormHistoryRepo, times(1)).saveAll(anyList());
        verify(activityLogService, times(1)).createLogs(anyList());
        verify(notificationService, times(1)).createNotificationsBatch(anyList());
    }
}
