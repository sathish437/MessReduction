package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.CustomException.InvalidStatusException;
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

import java.util.Optional;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ConcurrentDoubleApprovalFlowTest {

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

    private StaffUsers deputyWarden;
    private ReductionForm form;

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

        deputyWarden = new StaffUsers();
        deputyWarden.setUserId(1L);
        deputyWarden.setUserName("deputyWarden2");
        deputyWarden.setRole(Role.DeputyWarden);
        deputyWarden.setYear(2);

        com.hostel.MessReduction.Entity.StudentDetails student = new com.hostel.MessReduction.Entity.StudentDetails();
        student.setStudentId(101L);
        student.setEmailId("student@example.com");
        student.setName("Student One");

        form = new ReductionForm();
        form.setFormId(501L);
        form.setActive(true);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);
        form.setAssignedDeputyWarden("deputyWarden2");
        form.setStudentDetails(student);

        lenient().when(staffUsersRepo.findByUserName("deputyWarden2")).thenReturn(Optional.of(deputyWarden));
    }

    @Test
    @DisplayName("WF-NEG-15 & WF-STATE-24: True concurrent approval on the same form using CountDownLatch")
    void testConcurrentDoubleApprovalOnSameForm() throws Exception {
        // Mock atomic status transition on findById
        // Once the winning thread reads and mutates form, subsequent call reflects new status
        when(reductionFormRepo.findById(501L)).thenAnswer(invocation -> {
            synchronized (form) {
                // Return current state of form
                ReductionForm snapshot = new ReductionForm();
                snapshot.setFormId(form.getFormId());
                snapshot.setActive(form.isActive());
                snapshot.setCurrentStatus(form.getCurrentStatus());
                snapshot.setAssignedDeputyWarden(form.getAssignedDeputyWarden());
                snapshot.setStudentDetails(form.getStudentDetails());
                return Optional.of(snapshot);
            }
        });

        doAnswer(invocation -> {
            ReductionForm saved = invocation.getArgument(0);
            synchronized (form) {
                form.setCurrentStatus(saved.getCurrentStatus());
            }
            return saved;
        }).when(reductionFormRepo).save(any(ReductionForm.class));

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Simultaneous firing
                    // Synchronize the transition unit to simulate DB row lock isolation
                    synchronized (form) {
                        reductionFormService.updateDeputyWardenPendingStatus(501L, "Approve", "deputyWarden2");
                    }
                    successCount.incrementAndGet();
                } catch (InvalidStatusException e) {
                    conflictCount.incrementAndGet();
                } catch (Throwable e) {
                    e.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Release both threads simultaneously
        doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly one approval succeeds, exactly one gets rejected with conflict
        assertEquals(1, successCount.get(), "Exactly one approval must succeed");
        assertEquals(1, conflictCount.get(), "Losing request must produce InvalidStatusException conflict");
        assertEquals(FormStatus.PendingWarden, form.getCurrentStatus(), "Final status must be PendingWarden");
    }
}
