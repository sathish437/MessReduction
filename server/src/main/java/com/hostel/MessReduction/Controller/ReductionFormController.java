package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormHistoryResDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
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
    public StudentDetails fetchStudentData(@PathVariable Long studentId) {
        logger.info("Student controller reached: GET /Student/{}", studentId);
        return reductionFormService.getStudentDetails(studentId);
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
}
