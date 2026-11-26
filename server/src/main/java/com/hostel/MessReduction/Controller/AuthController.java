package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.SsoExchangeReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
import com.hostel.MessReduction.Service.HostelSsoService;
import com.hostel.MessReduction.Service.StudentAuthService;
import com.hostel.MessReduction.Service.StudentVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriUtils;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication APIs")
public class AuthController {

    private final StudentAuthService studentAuthService;
    private final StudentVerificationService studentVerificationService;
    private final HostelSsoService hostelSsoService;

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

    @PostMapping(value = "/hostel-sso", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "Verify signed HostelApp student SSO form post and redirect with one-time code")
    public ResponseEntity<Void> hostelSso(
            @RequestParam(value = "ts", required = false) String ts,
            @RequestParam(value = "nonce", required = false) String nonce,
            @RequestParam(value = "regno", required = false) String regno,
            @RequestParam(value = "sig", required = false) String sig) {
        String redirectPath;
        try {
            String code = hostelSsoService.verifyAndCreateSsoCode(ts, nonce, regno, sig);
            redirectPath = "/sso-callback?code=" + UriUtils.encodeQueryParam(code, StandardCharsets.UTF_8);
        } catch (HostelSsoService.SsoException ex) {
            redirectPath = "/student-login?error=" + UriUtils.encodeQueryParam(ex.getErrorCode(), StandardCharsets.UTF_8);
        }

        String location = hostelSsoService.buildFrontendRedirectUrl(redirectPath);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(location))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("Referrer-Policy", "no-referrer")
                .build();
    }

    @PostMapping("/sso-exchange")
    @Operation(summary = "Exchange a one-time SSO code for a student JWT session")
    public ResponseEntity<AuthResponseDTO> ssoExchange(@Valid @RequestBody SsoExchangeReqDTO request) {
        return ResponseEntity.ok(hostelSsoService.exchangeCode(request.getCode()));
    }
}
