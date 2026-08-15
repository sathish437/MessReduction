package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.DTO.ReqDTO.ActivityLogRequest;
import com.hostel.MessReduction.DTO.ResDTO.ActivityLogResponse;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Service.ActivityLogService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('Warden','DeputyWarden','Office')")
    public ResponseEntity<ActivityLogResponse> createLog(
            @Valid @RequestBody ActivityLogRequest request,
            Authentication authentication) {
        Role authenticatedRole = resolveAuthenticatedRole(authentication);
        if (authenticatedRole != request.getStaffRole()) {
            throw new BadRequestException("Staff can only create logs for their own role");
        }
        request.setStaffName(authentication.getName());
        request.setStaffRole(authenticatedRole);
        return ResponseEntity.ok(activityLogService.createLog(request));
    }

    @GetMapping("/my-logs")
    @PreAuthorize("hasAnyRole('Warden','DeputyWarden','Office')")
    public ResponseEntity<List<ActivityLogResponse>> getMyLogs(Authentication authentication) {
        return ResponseEntity.ok(activityLogService.findActiveLogsByStaffName(authentication.getName()));
    }

    @GetMapping("/role")
    @PreAuthorize("hasAnyRole('Warden','DeputyWarden','Office')")
    public ResponseEntity<org.springframework.data.domain.Page<ActivityLogResponse>> getLogsByRoleAndAction(
            @RequestParam String action,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate fromDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        Role authenticatedRole = resolveAuthenticatedRole(authentication);
        // Note: For DeputyWarden, year filter is strictly ignored
        Integer effectiveYear = (authenticatedRole == Role.DeputyWarden) ? null : year;
        return ResponseEntity.ok(activityLogService.getLogsByRoleAndAction(
                authenticatedRole, action, search, department, effectiveYear, fromDate, toDate, page, size, authentication.getName()));
    }

    private Role resolveAuthenticatedRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            throw new BadRequestException("Unable to resolve authenticated user role");
        }
        return authentication.getAuthorities().stream()
                .map(Object::toString)
                .filter(roleName -> roleName.startsWith("ROLE_"))
                .map(roleName -> roleName.substring(5))
                .map(roleStr -> {
                    try {
                        return Role.valueOf(roleStr);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Unable to resolve authenticated user role"));
    }
}
