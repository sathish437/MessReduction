package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.StudentVerificationFailedException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentRegistrationService {

    private final StudentVerificationService studentVerificationService;
    private final StudentDetailsService studentDetailsService;

    public StudentRegistrationService(
            StudentVerificationService studentVerificationService,
            StudentDetailsService studentDetailsService) {
        this.studentVerificationService = studentVerificationService;
        this.studentDetailsService = studentDetailsService;
    }

    @Transactional(rollbackFor = Exception.class)
    public StudentDetailsResDTO registerStudent(StudentDetailsReqDTO studentDto) {
        // 1. Verify student details using external API
        boolean isVerified = studentVerificationService.verifyStudent(studentDto);

        if (!isVerified) {
            throw new StudentVerificationFailedException(
                    "Invalid student credentials/details");
        }

        // 2. Save student details to database
        return studentDetailsService.addStudent(studentDto);
    }
}
