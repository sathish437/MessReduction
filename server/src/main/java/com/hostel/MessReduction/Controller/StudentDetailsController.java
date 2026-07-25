package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Service.StudentRegistrationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class StudentDetailsController {
    private final StudentRegistrationService studentRegistrationService;

    public StudentDetailsController(StudentRegistrationService studentRegistrationService){
        this.studentRegistrationService = studentRegistrationService;
    }

    @PostMapping("/reg")
    public StudentDetailsResDTO studentDetail(@Valid @RequestBody StudentDetailsReqDTO studentDetailsReqDTO){
        return studentRegistrationService.registerStudent(studentDetailsReqDTO);
    }
}
