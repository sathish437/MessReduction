package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Service.ReductionFormService;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student-form")
public class ReductionFormController {
    private ReductionFormService reductionFormService;
    public ReductionFormController(ReductionFormService reductionFormService){
        this.reductionFormService=reductionFormService;
    }
    @GetMapping("/StudentForm/{studentId}")
    public StudentDetails fetchStudentData(@PathVariable Long studentId){
        return reductionFormService.getStudentDetails(studentId);
    }
    @PostMapping("/StudentForm/{studentId}")
    public ResponseEntity<ReductionFormResDTO> studentSubmitForm(
            @Valid @RequestBody ReductionFormReqDTO dto,
            @PathVariable Long studentId) {

        return ResponseEntity.ok(reductionFormService.formSubmit(dto, studentId));
    }

}
