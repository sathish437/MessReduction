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

@RestController
@RequestMapping("/api/student-form")
public class ReductionFormController {
    private static final Logger logger = LoggerFactory.getLogger(ReductionFormController.class);
    private final ReductionFormService reductionFormService;

    public ReductionFormController(ReductionFormService reductionFormService) {
        this.reductionFormService = reductionFormService;
    }

    @GetMapping("/Student/{studentId}")
    public ResponseEntity<?> fetchStudentData(@PathVariable Long studentId) {
        logger.info("Student controller reached: GET /Student/{}", studentId);
        try {
            if (studentId == null || studentId <= 0) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid student ID", "statusCode", 400));
            }
            StudentDetails studentDetails = reductionFormService.getStudentDetails(studentId);
            return ResponseEntity.ok(studentDetails);
        } catch (com.hostel.MessReduction.CustomException.StudentNotFoundException e) {
            logger.warn("Student not found: {}", studentId);
            return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND)
                    .body(java.util.Map.of("message", e.getMessage(), "statusCode", 404));
        } catch (Exception e) {
            logger.error("Internal error fetching student data for studentId: {}", studentId, e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("message", "An unexpected error occurred", "statusCode", 500));
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
}

