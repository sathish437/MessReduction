package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.CustomException.BadRequestException;
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ConcurrentSubmissionRaceFlowTest {

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
        student.setName("Concurrent Student");
        student.setDailySubmissionCount(0);
        student.setExtraSubmissionGranted(0);
        student.setGender(Gender.MALE);
        student.setEmailId("concurrent@example.com");
        student.setLastSubmissionDate(LocalDate.now());

        deputyWarden = new StaffUsers();
        deputyWarden.setUserId(2L);
        deputyWarden.setUserName("deputyWarden2");
        deputyWarden.setRole(Role.DeputyWarden);
        deputyWarden.setGender(Gender.MALE);
        deputyWarden.setYear(2);

        lenient().when(studentDetailsRepo.findById(101L)).thenReturn(Optional.of(student));
        lenient().when(studentDetailsRepo.save(any(StudentDetails.class))).thenAnswer(invocation -> invocation.getArgument(0));

        lenient().when(staffUsersRepo.findByRoleAndGenderAndYear(Role.DeputyWarden, Gender.MALE, 2))
                .thenReturn(Optional.of(deputyWarden));
    }

    @Test
    @DisplayName("WF-BND-01 / Concurrency: Exactly 3 concurrent submissions succeed and 2 are rejected under row locking")
    void testConcurrentSubmissions_GuaranteesDailyLimitUnderConcurrency() throws Exception {
        when(reductionFormRepo.findByStudentDetailsStudentIdAndIsActiveTrue(101L))
                .thenReturn(Collections.emptyList());

        // Simulate DB row lock on StudentDetails: findByIdForUpdate serializes access and provides isolated snapshot
        java.util.concurrent.locks.ReentrantLock dbRowLock = new java.util.concurrent.locks.ReentrantLock();

        when(studentDetailsRepo.findByIdForUpdate(101L)).thenAnswer(invocation -> {
            dbRowLock.lock();
            return Optional.of(student);
        });

        when(studentDetailsRepo.save(any(StudentDetails.class))).thenAnswer(invocation -> {
            StudentDetails saved = invocation.getArgument(0);
            return saved;
        });

        int threadCount = 5; // Attempt 5 simultaneous submissions (limit is 3)
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger acceptedSubmissions = new AtomicInteger(0);
        AtomicInteger rejectedSubmissions = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Launch simultaneous requests at the exact same instant
                    ReductionFormReqDTO dto = new ReductionFormReqDTO();
                    dto.setYear(2);
                    dto.setRoomNo(101L);
                    dto.setLeaveDate(LocalDate.now().plusDays(1 + index * 5));
                    dto.setLeaveTime(LocalTime.of(9, 0));
                    dto.setToDate(LocalDate.now().plusDays(5 + index * 5));
                    dto.setArrivalDate(LocalDate.now().plusDays(6 + index * 5));
                    dto.setArrivalTime(LocalTime.of(18, 0));
                    dto.setReason("Test Concurrent Request");

                    reductionFormService.formSubmit(dto, 101L);
                    acceptedSubmissions.incrementAndGet();
                } catch (BadRequestException e) {
                    rejectedSubmissions.incrementAndGet();
                } catch (Throwable e) {
                    e.printStackTrace();
                } finally {
                    if (dbRowLock.isHeldByCurrentThread()) {
                        dbRowLock.unlock();
                    }
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Fire all 5 threads concurrently
        doneLatch.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        // With pessimistic row locking in place:
        // Exactly 3 submissions succeed and exactly 2 are rejected
        assertEquals(3, acceptedSubmissions.get(), "Under database row locking, exactly 3 submissions must succeed");
        assertEquals(2, rejectedSubmissions.get(), "Under database row locking, exactly 2 submissions must be rejected");
        assertEquals(3, student.getDailySubmissionCount(), "Final dailySubmissionCount must be exactly 3");
    }
}
