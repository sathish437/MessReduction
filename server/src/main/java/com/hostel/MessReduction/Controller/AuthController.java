package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
import com.hostel.MessReduction.Service.StudentAuthService;
import com.hostel.MessReduction.Service.StudentVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication APIs")
public class AuthController {

    private final StudentAuthService studentAuthService;
    private final StudentVerificationService studentVerificationService;

    @PostMapping("/login")
    @Operation(summary = "Student login with email and date of birth")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody StudentLoginReqDTO loginRequest) {
        AuthResponseDTO response = studentAuthService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-hostel")
    @Operation(summary = "Verify hostel student credentials before registration")
    public ResponseEntity<HostelVerifyResDTO> verifyHostel(@Valid @RequestBody HostelVerifyReqDTO verifyRequest) {
        HostelVerifyResDTO response = studentVerificationService.verifyHostelCredentials(verifyRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/hostel-verification-status")
    @Operation(summary = "Get status of hostel verification requirement")
    public ResponseEntity<Map<String, Boolean>> getHostelVerificationStatus() {
        return ResponseEntity.ok(Map.of("enabled", studentVerificationService.isEnabled()));
    }
}
