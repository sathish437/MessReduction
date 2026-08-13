package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.*;
import com.hostel.MessReduction.Repo.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BulkPerformanceServiceTest {

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @Mock
    private ReductionFormRepo reductionFormRepo;

    @Mock
    private ReductionFormHistoryRepo reductionFormHistoryRepo;

    @Mock
    private ExtraSubmissionRequestRepo extraSubmissionRequestRepo;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private StaffUsersRepo staffUsersRepo;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private AdminService adminService;

    @InjectMocks
    private ExtraSubmissionService extraSubmissionService;

    @Test
    @DisplayName("Bulk Delete 100 Students executes exactly 4 set-based batch repository queries")
    void testBulkDeleteStudentsSetBasedExecution() {
        List<Long> studentIds = new ArrayList<>();
        for (long i = 1; i <= 100; i++) {
            studentIds.add(i);
        }

        when(reductionFormHistoryRepo.deleteHistoriesByStudentIdsIn(anyList())).thenReturn(300);
        when(reductionFormRepo.deleteFormsByStudentIdsIn(anyList())).thenReturn(150);
        when(extraSubmissionRequestRepo.deleteExtraSubmissionsByStudentIdsIn(anyList())).thenReturn(50);
        when(studentDetailsRepo.deleteStudentsByIdsIn(anyList())).thenReturn(100);

        long start = System.nanoTime();
        adminService.bulkDeleteStudents(studentIds);
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;

        // Verify exactly 1 set-based call per entity table (Zero N+1 individual row calls)
        verify(reductionFormHistoryRepo, times(1)).deleteHistoriesByStudentIdsIn(studentIds);
        verify(reductionFormRepo, times(1)).deleteFormsByStudentIdsIn(studentIds);
        verify(extraSubmissionRequestRepo, times(1)).deleteExtraSubmissionsByStudentIdsIn(studentIds);
        verify(studentDetailsRepo, times(1)).deleteStudentsByIdsIn(studentIds);

        // Verify zero row-by-row calls
        verify(studentDetailsRepo, never()).delete(any(StudentDetails.class));
        verify(studentDetailsRepo, never()).deleteAll(anyList());
        verify(studentDetailsRepo, never()).deleteById(anyLong());

        assertTrue(elapsedMs < 100, "In-memory orchestration took: " + elapsedMs + " ms");
    }

    @Test
    @DisplayName("Bulk Extra Submission Approval processes in batch without loops of findById")
    void testBulkApproveExtraSubmissions() {
        List<Long> requestIds = List.of(1L, 2L, 3L, 4L, 5L);

        List<ExtraSubmissionRequest> mockRequests = new ArrayList<>();
        for (Long id : requestIds) {
            StudentDetails s = new StudentDetails();
            s.setStudentId(id + 100);
            s.setEmailId("student" + id + "@example.com");
            s.setExtraSubmissionGranted(0);

            ExtraSubmissionRequest req = new ExtraSubmissionRequest();
            req.setId(id);
            req.setStatus(RequestStatus.PENDING);
            req.setStudentDetails(s);
            mockRequests.add(req);
        }

        when(extraSubmissionRequestRepo.findAllById(requestIds)).thenReturn(mockRequests);

        extraSubmissionService.bulkApproveRequests(requestIds, "MasterAdmin");

        verify(extraSubmissionRequestRepo, times(1)).findAllById(requestIds);
        verify(extraSubmissionRequestRepo, times(1)).saveAll(anyList());
        verify(studentDetailsRepo, times(1)).saveAll(anyList());
        verify(notificationService, times(1)).createNotificationsBatch(anyList());
    }

    @Test
    @DisplayName("Bulk Extra Submission Rejection processes in batch without loops of findById")
    void testBulkRejectExtraSubmissions() {
        List<Long> requestIds = List.of(1L, 2L, 3L);

        List<ExtraSubmissionRequest> mockRequests = new ArrayList<>();
        for (Long id : requestIds) {
            StudentDetails s = new StudentDetails();
            s.setStudentId(id + 100);
            s.setEmailId("student" + id + "@example.com");

            ExtraSubmissionRequest req = new ExtraSubmissionRequest();
            req.setId(id);
            req.setStatus(RequestStatus.PENDING);
            req.setStudentDetails(s);
            mockRequests.add(req);
        }

        when(extraSubmissionRequestRepo.findAllById(requestIds)).thenReturn(mockRequests);

        extraSubmissionService.bulkRejectRequests(requestIds, "MasterAdmin");

        verify(extraSubmissionRequestRepo, times(1)).findAllById(requestIds);
        verify(extraSubmissionRequestRepo, times(1)).saveAll(anyList());
        verify(notificationService, times(1)).createNotificationsBatch(anyList());
    }
}
