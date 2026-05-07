package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.StaffUsersReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffLoginResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffValidateResDTO;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Service.StaffAuthService;
import com.hostel.MessReduction.security.StaffUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffAuthController {

    private final StaffAuthService staffAuthService;

    @PostMapping("/login")
    public ResponseEntity<StaffLoginResDTO> login(@Valid @RequestBody StaffUsersReqDTO loginReqDTO) {
        StaffLoginResDTO response = staffAuthService.login(loginReqDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * Dedicated token validation endpoint.
     * Returns auth identity info if token is valid.
     * Returns 401 if token is invalid or expired.
     * 
     * This endpoint is protected - JwtFilter validates the JWT before this method executes
     * and populates SecurityContextHolder with the authenticated user.
     */
    @GetMapping("/validate")
    public ResponseEntity<StaffValidateResDTO> validateToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // If no authentication in SecurityContext, return 401
        // This should not happen if the endpoint is properly secured and JWT is valid
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        // Extract user info from SecurityContext (populated by JwtFilter)
        String username = authentication.getName();
        Role role = null;
        
        // Cast principal to StaffUserDetails to get Role enum directly
        if (authentication.getPrincipal() instanceof StaffUserDetails) {
            StaffUserDetails staffDetails = (StaffUserDetails) authentication.getPrincipal();
            role = staffDetails.getRole();
        }
        
        // Fallback: parse role from authorities if principal is not StaffUserDetails
        if (role == null) {
            String authority = authentication.getAuthorities().iterator().next().getAuthority();
            String roleName = authority.replace("ROLE_", "");
            role = Role.valueOf(roleName);
        }

        StaffValidateResDTO response = new StaffValidateResDTO(true, username, role);
        return ResponseEntity.ok(response);
    }
}
