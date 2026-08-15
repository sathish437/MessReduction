package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ReqDTO.ActivityLogRequest;
import com.hostel.MessReduction.DTO.ResDTO.ActivityLogResponse;
import com.hostel.MessReduction.Entity.ActivityLog;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Repo.ActivityLogRepository;
import com.hostel.MessReduction.Repo.ReductionFormRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ActivityLogServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ReductionFormRepo reductionFormRepo;

    @InjectMocks
    private ActivityLogService activityLogService;

    private ActivityLog sampleLog;

    @BeforeEach
    void setUp() {
        sampleLog = new ActivityLog();
        sampleLog.setId(1L);
        sampleLog.setFormId(101L);
        sampleLog.setStudentId(7100123L);
        sampleLog.setStudentName("Arjun Kumar");
        sampleLog.setDepartment("CSE");
        sampleLog.setYear(3);
        sampleLog.setStaffRole(Role.Warden);
        sampleLog.setStaffName("warden");
        sampleLog.setAction("Approved");
        sampleLog.setTimestamp(LocalDateTime.now());
        sampleLog.setArrivalDate(LocalDate.now().plusDays(5));
        sampleLog.setActive(true);
    }

    @Test
    void testCreateLog_SuccessWithYear() {
        ActivityLogRequest req = new ActivityLogRequest();
        req.setFormId(101L);
        req.setStudentId(7100123L);
        req.setStudentName("Arjun Kumar");
        req.setDepartment("CSE");
        req.setYear(3);
        req.setStaffRole(Role.Warden);
        req.setStaffName("warden");
        req.setAction("Approved");
        req.setArrivalDate(LocalDate.now().plusDays(5));

        when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(i -> {
            ActivityLog saved = i.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        ActivityLogResponse res = activityLogService.createLog(req);

        assertNotNull(res);
        assertEquals(101L, res.getFormId());
        assertEquals("Arjun Kumar", res.getStudentName());
        assertEquals(3, res.getYear());
        assertEquals("Approved", res.getAction());
        assertEquals(Role.Warden, res.getStaffRole());
    }

    @Test
    void testCreateLogs_BulkSuccess() {
        ActivityLogRequest req1 = new ActivityLogRequest();
        req1.setFormId(101L);
        req1.setStudentId(7100123L);
        req1.setStudentName("Arjun");
        req1.setDepartment("CSE");
        req1.setYear(2);
        req1.setStaffRole(Role.Office);
        req1.setStaffName("office");
        req1.setAction("Approved");
        req1.setArrivalDate(LocalDate.now().plusDays(3));

        activityLogService.createLogs(Collections.singletonList(req1));

        ArgumentCaptor<List<ActivityLog>> captor = ArgumentCaptor.forClass(List.class);
        verify(activityLogRepository, times(1)).saveAll(captor.capture());
        assertEquals(1, captor.getValue().size());
        assertEquals(2, captor.getValue().get(0).getYear());
    }

    @Test
    void testGetLogsByRoleAndAction_WardenApproved_WithFilters() {
        Page<ActivityLog> pageResult = new PageImpl<>(List.of(sampleLog));
        when(activityLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageResult);

        Page<ActivityLogResponse> result = activityLogService.getLogsByRoleAndAction(
                Role.Warden,
                "Approved",
                "Arjun",
                "CSE",
                3,
                LocalDate.now().minusDays(7),
                LocalDate.now(),
                0,
                10,
                "warden"
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        ActivityLogResponse item = result.getContent().get(0);
        assertEquals("Arjun Kumar", item.getStudentName());
        assertEquals("CSE", item.getDepartment());
        assertEquals(3, item.getYear());
        assertEquals("Approved", item.getAction());
    }

    @Test
    void testGetLogsByRoleAndAction_DeputyWarden_YearFilterIgnored() {
        ActivityLog dwLog = new ActivityLog();
        dwLog.setId(2L);
        dwLog.setFormId(202L);
        dwLog.setStudentId(7100456L);
        dwLog.setStudentName("Priya Sharma");
        dwLog.setDepartment("ECE");
        dwLog.setYear(1);
        dwLog.setStaffRole(Role.DeputyWarden);
        dwLog.setStaffName("deputyWarden1");
        dwLog.setAction("Rejected");
        dwLog.setTimestamp(LocalDateTime.now());
        dwLog.setArrivalDate(LocalDate.now().plusDays(2));
        dwLog.setActive(true);

        Page<ActivityLog> pageResult = new PageImpl<>(List.of(dwLog));
        when(activityLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageResult);

        Page<ActivityLogResponse> result = activityLogService.getLogsByRoleAndAction(
                Role.DeputyWarden,
                "Rejected",
                null,
                "ECE",
                null, // Deputy Warden has no year filter
                null,
                null,
                0,
                10,
                "deputyWarden1"
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Priya Sharma", result.getContent().get(0).getStudentName());
        assertEquals("Rejected", result.getContent().get(0).getAction());
    }

    @Test
    void testGetLogsByRoleAndAction_PaginationWorks() {
        Page<ActivityLog> emptyPage = new PageImpl<>(Collections.emptyList());
        when(activityLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        Page<ActivityLogResponse> result = activityLogService.getLogsByRoleAndAction(
                Role.Office,
                "Approved",
                null,
                null,
                null,
                null,
                null,
                3, // Page 4 (0-indexed 3)
                20, // Page size 20
                "office"
        );

        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
        verify(activityLogRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void testGetLogsByRoleAndAction_ResolvesMissingYearFromReductionForm() {
        ActivityLog logWithoutYear = new ActivityLog();
        logWithoutYear.setId(5L);
        logWithoutYear.setFormId(204L);
        logWithoutYear.setStudentId(458L);
        logWithoutYear.setStudentName("Ananya Reddy");
        logWithoutYear.setDepartment("MECH");
        logWithoutYear.setYear(null); // null in DB
        logWithoutYear.setStaffRole(Role.Warden);
        logWithoutYear.setStaffName("warden");
        logWithoutYear.setAction("Approved");
        logWithoutYear.setTimestamp(LocalDateTime.now());
        logWithoutYear.setArrivalDate(LocalDate.now().plusDays(2));
        logWithoutYear.setActive(true);

        ReductionForm form = new ReductionForm();
        form.setFormId(204L);
        form.setYear(2);

        Page<ActivityLog> pageResult = new PageImpl<>(List.of(logWithoutYear));
        when(activityLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageResult);
        when(reductionFormRepo.findAllById(List.of(204L))).thenReturn(List.of(form));

        Page<ActivityLogResponse> result = activityLogService.getLogsByRoleAndAction(
                Role.Warden,
                "Approved",
                null,
                null,
                null,
                null,
                null,
                0,
                10,
                "warden"
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        ActivityLogResponse item = result.getContent().get(0);
        assertEquals("Ananya Reddy", item.getStudentName());
        assertEquals(2, item.getYear()); // Resolved to 2
    }
}
