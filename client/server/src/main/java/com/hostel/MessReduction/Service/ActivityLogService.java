package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.DTO.ReqDTO.ActivityLogRequest;
import com.hostel.MessReduction.DTO.ResDTO.ActivityLogResponse;
import com.hostel.MessReduction.Entity.ActivityLog;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Repo.ActivityLogRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    public ActivityLogResponse createLog(ActivityLogRequest request) {
        validateRequest(request);

        ActivityLog log = new ActivityLog();
        log.setFormId(request.getFormId());
        log.setStudentId(request.getStudentId());
        log.setStudentName(request.getStudentName());
        log.setDepartment(request.getDepartment());
        log.setStaffRole(request.getStaffRole());
        log.setStaffName(request.getStaffName());
        log.setAction(request.getAction());
        log.setTimestamp(LocalDateTime.now());
        log.setArrivalDate(request.getArrivalDate());
        log.setActive(true);

        return mapToResponse(activityLogRepository.save(log));
    }

    public List<ActivityLogResponse> findActiveLogsByRole(Role staffRole) {
        return activityLogRepository.findByStaffRoleAndIsActiveTrue(staffRole).stream()
                .sorted(Comparator.comparing(ActivityLog::getTimestamp).reversed())
                .map(this::mapToResponse)
                .toList();
    }

    public void expireLogs() {
        LocalDate today = LocalDate.now();
        List<ActivityLog> expiredLogs = activityLogRepository.findByIsActiveTrueAndArrivalDateBefore(today);
        if (expiredLogs.isEmpty()) {
            return;
        }
        expiredLogs.forEach(log -> log.setActive(false));
        activityLogRepository.saveAll(expiredLogs);
    }

    private void validateRequest(ActivityLogRequest request) {
        if (request.getStaffRole() == null) {
            throw new BadRequestException("Staff role is required for activity logs");
        }
        if (request.getArrivalDate() == null) {
            throw new BadRequestException("Arrival date is required for activity logs");
        }
    }

    private ActivityLogResponse mapToResponse(ActivityLog log) {
        return new ActivityLogResponse(
                log.getId(),
                log.getFormId(),
                log.getStudentId(),
                log.getStudentName(),
                log.getDepartment(),
                log.getStaffRole(),
                log.getStaffName(),
                log.getAction(),
                log.getTimestamp(),
                log.getArrivalDate(),
                log.isActive()
        );
    }
}
