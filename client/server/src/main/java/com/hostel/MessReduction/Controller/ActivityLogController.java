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

    @GetMapping("/{role}")
    @PreAuthorize("hasAnyRole('Warden','DeputyWarden','Office')")
    public ResponseEntity<List<ActivityLogResponse>> getLogsByRole(
            @PathVariable String role,
            Authentication authentication) {
        Role requestedRole = resolveRole(role);
        Role authenticatedRole = resolveAuthenticatedRole(authentication);
        if (authenticatedRole != requestedRole) {
            throw new BadRequestException("Access denied: users may only request logs for their own role");
        }
        return ResponseEntity.ok(activityLogService.findActiveLogsByRole(requestedRole));
    }

    private Role resolveRole(String requestedRole) {
        if (requestedRole == null) {
            throw new BadRequestException("Role path variable is required");
        }
        return switch (requestedRole.trim().toUpperCase()) {
            case "WARDEN" -> Role.Warden;
            case "DEPUTY", "DEPUTYWARDEN", "DEPUTY_WARDEN" -> Role.DeputyWarden;
            case "OFFICE" -> Role.Office;
            default -> throw new BadRequestException("Invalid role: " + requestedRole);
        };
    }

    private Role resolveAuthenticatedRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(Object::toString)
                .filter(roleName -> roleName.startsWith("ROLE_"))
                .map(roleName -> roleName.substring(5))
                .map(this::resolveRole)
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Unable to resolve authenticated user role"));
    }
}
