package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormHistoryResDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.DTO.ResDTO.RequestTrackingResDTO;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Service.ReductionFormService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.hostel.MessReduction.Service.ExtraSubmissionService;

@RestController
@RequestMapping("/api/student-form")
public class ReductionFormController {
    private static final Logger logger = LoggerFactory.getLogger(ReductionFormController.class);
    private final ReductionFormService reductionFormService;
    private final ExtraSubmissionService extraSubmissionService;

    public ReductionFormController(ReductionFormService reductionFormService, ExtraSubmissionService extraSubmissionService) {
        this.reductionFormService = reductionFormService;
        this.extraSubmissionService = extraSubmissionService;
    }

    @GetMapping("/Student/{studentId}")
    public ResponseEntity<?> fetchStudentData(@PathVariable Long studentId) {
        logger.info("Student controller entered: GET /Student/{}", studentId);
        try {
            if (studentId == null || studentId <= 0) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid student ID", "statusCode", 400));
            }
            java.util.Map<String, Object> response = reductionFormService.getStudentProfileWithForms(studentId);
            logger.info("Response successfully mapped and returning 200 OK");
            return ResponseEntity.ok(response);
        } catch (com.hostel.MessReduction.CustomException.StudentNotFoundException e) {
            logger.warn("Student not found: {}", studentId);
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("message", e.getMessage(), "statusCode", 404));
        } catch (com.hostel.MessReduction.CustomException.BadRequestException e) {
            logger.warn("Bad request fetching student data: {}", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("message", e.getMessage(), "statusCode", 400));
        } catch (Exception e) {
            logger.error("Internal error fetching student data for studentId: {}", studentId, e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "Unable to fetch student reduction forms.", "statusCode", 500));
        }
    }

    @PostMapping("/StudentForm/{studentId}")
    public ResponseEntity<ReductionFormResDTO> studentSubmitForm(
            @Valid @RequestBody ReductionFormReqDTO dto,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(reductionFormService.formSubmit(dto, studentId));
    }

    @GetMapping("/StudentForm/{studentId}")
    public ResponseEntity<List<ReductionFormResDTO>> getStudentForms(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(reductionFormService.formDetails(studentId));
    }

    @GetMapping("/StudentForm/{studentId}/{formId}")
    public ResponseEntity<ReductionFormResDTO> getStudentFormForEdit(
            @PathVariable Long studentId,
            @PathVariable Long formId) {
        return ResponseEntity.ok(reductionFormService.getFormForEdit(formId, studentId));
    }

    @PostMapping("/StudentForm/{studentId}/{formId}/resubmit")
    public ResponseEntity<ReductionFormResDTO> resubmitStudentForm(
            @PathVariable Long studentId,
            @PathVariable Long formId,
            @Valid @RequestBody ReductionFormReqDTO dto) {
        return ResponseEntity.ok(reductionFormService.resubmitForm(formId, studentId, dto));
    }

    @GetMapping("/StudentForm/{studentId}/{formId}/history")
    public ResponseEntity<List<ReductionFormHistoryResDTO>> getStudentFormHistory(
            @PathVariable Long studentId,
            @PathVariable Long formId) {
        return ResponseEntity.ok(reductionFormService.getFormHistory(formId, studentId));
    }

    @GetMapping("/StudentForm/{studentId}/{formId}/tracking")
    public ResponseEntity<RequestTrackingResDTO> getRequestTracking(
            @PathVariable Long studentId,
            @PathVariable Long formId) {
        return ResponseEntity.ok(reductionFormService.getTrackingDetails(formId));
    }

    @DeleteMapping("/StudentForm/{studentId}/{formId}")
    public ResponseEntity<java.util.Map<String, String>> deleteStudentRequest(
            @PathVariable Long studentId,
            @PathVariable Long formId) {
        reductionFormService.deleteStudentRequest(formId, studentId);
        return ResponseEntity.ok(java.util.Map.of("message", "Request deleted successfully"));
    }

    @GetMapping("/limits/{studentId}")
    public ResponseEntity<?> getStudentLimits(@PathVariable Long studentId) {
        try {
            StudentDetails student = reductionFormService.getStudentDetails(studentId);
            int count = student.getDailySubmissionCount() != null ? student.getDailySubmissionCount() : 0;
            int granted = student.getExtraSubmissionGranted() != null ? student.getExtraSubmissionGranted() : 0;
            int used = student.getExtraSubmissionUsed() != null ? student.getExtraSubmissionUsed() : 0;
            
            int extraRemaining = Math.max(0, granted - used);
            
            return ResponseEntity.ok(java.util.Map.of(
                "dailyCount", count,
                "extraRemaining", Math.max(0, extraRemaining),
                "limitReached", count >= 3 && extraRemaining <= 0
            ));
        } catch (com.hostel.MessReduction.CustomException.StudentNotFoundException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("message", e.getMessage(), "statusCode", 404));
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "An error occurred fetching limits", "statusCode", 500));
        }
    }
    
    @PostMapping("/extra-submission/{studentId}")
    public ResponseEntity<?> requestExtraSubmission(
            @PathVariable Long studentId,
            @RequestBody java.util.Map<String, String> payload) {
        String reason = payload.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body((java.util.Map) java.util.Map.of("message", "Reason is required", "statusCode", 400));
        }
        return ResponseEntity.ok(extraSubmissionService.requestExtraSubmission(studentId, reason));
    }
}
