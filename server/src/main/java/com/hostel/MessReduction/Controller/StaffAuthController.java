package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.StaffUsersReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffLoginResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffValidateResDTO;
import com.hostel.MessReduction.Service.StaffAuthService;
import com.hostel.MessReduction.security.StaffJwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffAuthController {

    private final StaffAuthService staffAuthService;
    private final StaffJwtUtil staffJwtUtil;

    @PostMapping("/login")
    public ResponseEntity<StaffLoginResDTO> login(@Valid @RequestBody StaffUsersReqDTO loginReqDTO) {
        StaffLoginResDTO response = staffAuthService.login(loginReqDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * Dedicated token validation endpoint.
     * Returns auth identity info if token is valid.
     * Returns 401 if token is invalid or expired.
     */
    @GetMapping("/validate")
    public ResponseEntity<StaffValidateResDTO> validateToken(
            @RequestHeader("Authorization") String authHeader) {
        // Extract token from Authorization header
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // Validate token
        if (token == null || staffJwtUtil.isTokenExpired(token)) {
            return ResponseEntity.status(401).build();
        }

        // Extract user info from valid token
        String username = staffJwtUtil.extractUsername(token);
        var role = staffJwtUtil.extractRole(token);

        StaffValidateResDTO response = new StaffValidateResDTO(true, username, role);
        return ResponseEntity.ok(response);
    }
}
