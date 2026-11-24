package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.CustomException.BadRequestException;
import com.hostel.MessReduction.DTO.ReqDTO.CompleteProfileReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Service.StudentAuthService;
import com.hostel.MessReduction.Service.StudentRegistrationService;
import com.hostel.MessReduction.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@Tag(name = "Student Details", description = "Student management and onboarding APIs")
public class StudentDetailsController {

    private final StudentRegistrationService studentRegistrationService;
    private final StudentAuthService studentAuthService;

    @PostMapping("/reg")
    @Operation(summary = "Register student details")
    public StudentDetailsResDTO studentDetail(@Valid @RequestBody StudentDetailsReqDTO studentDetailsReqDTO){
        return studentRegistrationService.registerStudent(studentDetailsReqDTO);
    }

    @PostMapping("/complete-profile")
    @Operation(summary = "Complete student profile with DOB and Phone Number after first hostel login")
    public ResponseEntity<Map<String, Object>> completeProfile(
            @Valid @RequestBody CompleteProfileReqDTO completeProfileReqDTO,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("Authentication required to complete profile.");
        }

        Long studentId = null;
        String username = authentication.getName();

        if (authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            studentId = userDetails.getStudentId();
            username = userDetails.getUsername();
        }

        studentAuthService.completeProfile(studentId, username, completeProfileReqDTO);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profile completed successfully."
        ));
    }
}
