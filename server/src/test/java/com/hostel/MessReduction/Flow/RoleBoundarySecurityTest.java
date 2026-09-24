package com.hostel.MessReduction.Flow;

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
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RoleBoundarySecurityTest {

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

    @Mock
    private com.hostel.MessReduction.Repo.AutoAcceptSettingsRepo autoAcceptSettingsRepo;

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
                autoAcceptSettingsRepo,
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

    @Test
    @DisplayName("WF-ABU-13: Warden attempting to approve form belonging to different academic year is rejected (403 Unauthorized)")
    void testWardenCrossYearAccess_Rejected() {
        ReductionForm year3Form = new ReductionForm();
        year3Form.setFormId(701L);
        year3Form.setActive(true);
        year3Form.setYear(3); // Year 3 form
        year3Form.setCurrentStatus(FormStatus.PendingWarden);

        when(reductionFormRepo.findById(701L)).thenReturn(Optional.of(year3Form));

        // Warden2 (assigned year 2) attempts to approve year 3 form
        assertThrows(UnauthorizedUserException.class, () ->
                reductionFormService.updateWardenPendingStatus(701L, "Approve", "warden2")
        );
    }

    @Test
    @DisplayName("WF-ABU-14: Deputy Warden attempting to approve form assigned to another Deputy Warden is rejected (403 Unauthorized)")
    void testDeputyWardenCrossScopeAccess_Rejected() {
        ReductionForm deputy6Form = new ReductionForm();
        deputy6Form.setFormId(702L);
        deputy6Form.setActive(true);
        deputy6Form.setYear(2);
        deputy6Form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        deputy6Form.setAssignedDeputyWarden("deputyWarden6"); // Different assigned deputy

        when(reductionFormRepo.findById(702L)).thenReturn(Optional.of(deputy6Form));

        // deputyWarden2 attempts to approve deputyWarden6's form
        assertThrows(UnauthorizedUserException.class, () ->
                reductionFormService.updateDeputyWardenPendingStatus(702L, "Approve", "deputyWarden2")
        );
    }

    @Test
    @DisplayName("WF-ABU-12: Non-deputy username attempting to invoke Deputy Warden action throws UnauthorizedUserException")
    void testNonDeputyInvokingDeputyAction_Rejected() {
        // "student1" or arbitrary non-deputy user
        assertThrows(UnauthorizedUserException.class, () ->
                reductionFormService.updateDeputyWardenPendingStatus(703L, "Approve", "student1")
        );
    }

    @Test
    @DisplayName("WF-ABU-16: Non-office username attempting to invoke Office action throws UnauthorizedUserException")
    void testNonOfficeInvokingOfficeAction_Rejected() {
        assertThrows(UnauthorizedUserException.class, () ->
                reductionFormService.updateOfficePendingStatus(704L, "Approve", "deputyWarden2")
        );
    }

    @Test
    @DisplayName("WF-ABU-11: Student attempting to execute warden or deputy actions throws UnauthorizedUserException")
    void testStudentInvokingStaffApproval_Rejected() {
        assertThrows(UnauthorizedUserException.class, () ->
                reductionFormService.updateWardenPendingStatus(705L, "Approve", "student123")
        );
        assertThrows(UnauthorizedUserException.class, () ->
                reductionFormService.updateDeputyWardenPendingStatus(705L, "Approve", "student123")
        );
    }

    @Test
    @DisplayName("WF-ABU-15: Office user attempting to invoke warden approval is rejected")
    void testOfficeInvokingWardenApproval_Rejected() {
        assertThrows(UnauthorizedUserException.class, () ->
                reductionFormService.updateWardenPendingStatus(706L, "Approve", "officeUser")
        );
    }
}
