package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.StudentVerificationFailedException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentRegistrationService {

    private final StudentDetailsService studentDetailsService;
    private final StudentVerificationService studentVerificationService;

    public StudentRegistrationService(StudentDetailsService studentDetailsService,
                                      StudentVerificationService studentVerificationService) {
        this.studentDetailsService = studentDetailsService;
        this.studentVerificationService = studentVerificationService;
    }

    @Transactional(rollbackFor = Exception.class)
    public StudentDetailsResDTO registerStudent(StudentDetailsReqDTO studentDto) {
        if (studentVerificationService != null && studentVerificationService.isEnabled()) {
            if (!studentVerificationService.isRegisterNoVerified(studentDto.getRegisterNo())) {
                throw new StudentVerificationFailedException(
                        "Hostel verification required before registration. Please verify your hostel credentials first.");
            }
        }
        StudentDetailsResDTO res = studentDetailsService.addStudent(studentDto);
        if (studentVerificationService != null) {
            studentVerificationService.consumeVerification(studentDto.getRegisterNo());
        }
        return res;
    }
}
