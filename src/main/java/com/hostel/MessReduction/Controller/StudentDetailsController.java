package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Service.StudentDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class StudentDetailsController {
    private final StudentDetailsService studentDetailsService;
    public StudentDetailsController(StudentDetailsService studentDetailsService){
        this.studentDetailsService=studentDetailsService;
    }

    @PostMapping("/reg")
    public StudentDetailsResDTO studentDetail(@RequestBody StudentDetailsReqDTO studentDetailsReqDTO){
        return studentDetailsService.addStudent(studentDetailsReqDTO);
    }
}
