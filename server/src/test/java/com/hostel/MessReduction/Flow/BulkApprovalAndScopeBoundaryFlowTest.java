package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.CustomException.InvalidActionException;
import com.hostel.MessReduction.CustomException.InvalidStatusException;
import com.hostel.MessReduction.CustomException.UnauthorizedUserException;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
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

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BulkApprovalAndScopeBoundaryFlowTest {

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

    private StaffUsers deputyWarden;

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

        deputyWarden = new StaffUsers();
        deputyWarden.setUserId(1L);
        deputyWarden.setUserName("deputyWarden2");
        deputyWarden.setRole(Role.DeputyWarden);
        deputyWarden.setYear(2);

        org.mockito.Mockito.lenient().when(staffUsersRepo.findByUserName("deputyWarden2")).thenReturn(Optional.of(deputyWarden));
    }

    @Test
    @DisplayName("WF-NEG-17: Bulk operation with empty form ID list is rejected with 400 Bad Request")
    void testBulkOperation_EmptyFormIdsRejected() {
        assertThrows(BadRequestException.class, () ->
                reductionFormService.updateDeputyWardenPendingBulkStatus(Collections.emptyList(), "Approve", "deputyWarden2")
        );
    }

    @Test
    @DisplayName("WF-NEG-29: Invalid action string in single approval endpoint is rejected")
    void testSingleApproval_InvalidActionRejected() {
        // In ReductionFormService, validateApproveAction occurs before looking up the form
        assertThrows(InvalidActionException.class, () ->
                reductionFormService.updateDeputyWardenPendingStatus(501L, "INVALID_ACTION", "deputyWarden2")
        );
    }

    @Test
    @DisplayName("WF-ABU-14 & WF-ABU-15: Deputy Warden cannot approve form outside assigned scope")
    void testDeputyApproval_OutOfScopeRejected() {
        ReductionForm form = new ReductionForm();
        form.setFormId(501L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setAssignedDeputyWarden("deputyWarden6"); // Belongs to deputy 6

        when(reductionFormRepo.findById(501L)).thenReturn(Optional.of(form));

        // Deputy 2 tries to approve Deputy 6's form
        assertThrows(UnauthorizedUserException.class, () ->
                reductionFormService.updateDeputyWardenPendingStatus(501L, "Approve", "deputyWarden2")
        );
    }

    @Test
    @DisplayName("WF-NEG-15 & WF-STATE-24: Approving a form already approved or not in pending stage throws InvalidStatusException")
    void testDoubleApproval_ThrowsInvalidStatusException() {
        ReductionForm form = new ReductionForm();
        form.setFormId(501L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingWarden); // Already advanced past Deputy
        form.setAssignedDeputyWarden("deputyWarden2");

        when(reductionFormRepo.findById(501L)).thenReturn(Optional.of(form));

        assertThrows(InvalidStatusException.class, () ->
                reductionFormService.updateDeputyWardenPendingStatus(501L, "Approve", "deputyWarden2")
        );
    }
}
