package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.Service.StudentAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication APIs")
public class AuthController {

    private final StudentAuthService studentAuthService;

    @PostMapping("/login")
    @Operation(summary = "Student login with email and date of birth")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody StudentLoginReqDTO loginRequest) {
        AuthResponseDTO response = studentAuthService.login(loginRequest);
        return ResponseEntity.ok(response);
    }
}
