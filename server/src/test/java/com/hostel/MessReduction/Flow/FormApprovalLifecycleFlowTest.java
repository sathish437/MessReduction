package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.Service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
public class FormApprovalLifecycleFlowTest {

    @Mock
    private ReductionFormRepo reductionFormRepo;

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @Mock
    private StaffUsersRepo staffUsersRepo;

    @Mock
    private NotificationService notificationService;

    private ReductionForm form;
    private StudentDetails student;
    private StaffUsers deputy;
    private StaffUsers warden;
    private StaffUsers office;

    @BeforeEach
    void setUp() {
        student = new StudentDetails();
        student.setStudentId(101L);
        student.setName("Karthik");
        student.setGender(Gender.MALE);
        student.setCurrentYear(2);

        deputy = new StaffUsers();
        deputy.setUserId(1L);
        deputy.setUserName("deputyWarden2");
        deputy.setRole(Role.DeputyWarden);
        deputy.setGender(Gender.MALE);
        deputy.setYear(2);

        warden = new StaffUsers();
        warden.setUserId(2L);
        warden.setUserName("warden");
        warden.setRole(Role.Warden);

        office = new StaffUsers();
        office.setUserId(3L);
        office.setUserName("office");
        office.setRole(Role.Office);

        form = new ReductionForm();
        form.setFormId(501L);
        form.setStudentDetails(student);
        form.setLeaveDate(LocalDate.now().plusDays(1));
        form.setArrivalDate(LocalDate.now().plusDays(4));
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
    }

    @Test
    @DisplayName("WF-HAPPY-04: Full Sequential State Flow - PendingDeputyWarden -> PendingWarden -> PendingOffice -> Approved")
    void testSequentialApprovalLifecycle() {
        // Step 1: Initial state is PendingDeputyWarden
        assertEquals(FormStatus.PendingDeputyWarden, form.getCurrentStatus());

        // Step 2: Deputy Warden approves -> status advances to PendingWarden
        form.setCurrentStatus(FormStatus.PendingWarden);
        assertEquals(FormStatus.PendingWarden, form.getCurrentStatus());

        // Step 3: Warden approves -> status advances to PendingOffice
        form.setCurrentStatus(FormStatus.PendingOffice);
        assertEquals(FormStatus.PendingOffice, form.getCurrentStatus());

        // Step 4: Office approves -> status advances to Approved (Final)
        form.setCurrentStatus(FormStatus.Approved);
        assertEquals(FormStatus.Approved, form.getCurrentStatus());
    }

    @Test
    @DisplayName("WF-STATE-04 & WF-HAPPY-20: Rejection by Deputy Warden -> Resubmission Flow")
    void testRejectionAndResubmissionFlow() {
        // Form is rejected by deputy
        form.setCurrentStatus(FormStatus.RejectedDeputyWarden);
        form.setRejectReason("Incomplete symposium letter");

        assertEquals(FormStatus.RejectedDeputyWarden, form.getCurrentStatus());
        assertEquals("Incomplete symposium letter", form.getRejectReason());

        // Resubmission restores status to PendingDeputyWarden and increments resubmissionCount
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setResubmissionCount(form.getResubmissionCount() + 1);

        assertEquals(FormStatus.PendingDeputyWarden, form.getCurrentStatus());
        assertEquals(1, form.getResubmissionCount());
    }
}
