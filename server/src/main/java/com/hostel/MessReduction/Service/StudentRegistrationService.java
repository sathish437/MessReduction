package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentRegistrationService {

    private final StudentDetailsService studentDetailsService;

    public StudentRegistrationService(StudentDetailsService studentDetailsService) {
        this.studentDetailsService = studentDetailsService;
    }

    @Transactional(rollbackFor = Exception.class)
    public StudentDetailsResDTO registerStudent(StudentDetailsReqDTO studentDto) {
        return studentDetailsService.addStudent(studentDto);
    }
}
