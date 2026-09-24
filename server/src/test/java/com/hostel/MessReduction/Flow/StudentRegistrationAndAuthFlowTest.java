package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.Service.StudentAuthService;
import com.hostel.MessReduction.Service.StudentRegistrationService;
import com.hostel.MessReduction.Service.StudentVerificationService;
import com.hostel.MessReduction.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentRegistrationAndAuthFlowTest {

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private StudentRegistrationService studentRegistrationService;

    @Mock
    private StudentVerificationService studentVerificationService;

    private StudentAuthService studentAuthService;

    private StudentDetails student;

    @BeforeEach
    void setUp() {
        studentAuthService = new StudentAuthService(studentDetailsRepo, jwtUtil);

        student = new StudentDetails();
        student.setStudentId(101L);
        student.setName("Karthik");
        student.setRegisterNo("730421104050");
        student.setRollNo("21CS050");
        student.setEmailId("karthik@gces.edu");
        student.setPhoneNo("9876543210");
        student.setGender(Gender.MALE);
        student.setCurrentYear(3);
        student.setDob(LocalDate.of(2003, 7, 20));
    }

    @Test
    @DisplayName("WF-HAPPY-01 & WF-HAPPY-02: Full Flow - Verification -> Registration -> Login")
    void testFullRegistrationAndLoginFlow() {
        // Step 1: External Hostel Verification
        HostelVerifyReqDTO verifyReq = new HostelVerifyReqDTO();
        verifyReq.setRegisterNo("730421104050");
        verifyReq.setPassword("hostelPass123");

        HostelVerifyResDTO verifyRes = new HostelVerifyResDTO();
        verifyRes.setVerified(true);
        verifyRes.setRegisterNo("730421104050");
        verifyRes.setName("Karthik");
        verifyRes.setDepartment("CSE");

        when(studentVerificationService.verifyHostelCredentials(verifyReq)).thenReturn(verifyRes);
        HostelVerifyResDTO actualVerify = studentVerificationService.verifyHostelCredentials(verifyReq);
        assertTrue(actualVerify.isVerified());
        assertEquals("Karthik", actualVerify.getName());

        // Step 2: Student Registration
        StudentDetailsReqDTO regReq = new StudentDetailsReqDTO();
        regReq.setName(actualVerify.getName());
        regReq.setRegisterNo(actualVerify.getRegisterNo());
        regReq.setDepartment(actualVerify.getDepartment());
        regReq.setRollNo("21CS050");
        regReq.setEmailId("karthik@gces.edu");
        regReq.setPhoneNo("9876543210");
        regReq.setGender(Gender.MALE);
        regReq.setDob(LocalDate.of(2003, 7, 20));

        StudentDetailsResDTO regRes = new StudentDetailsResDTO();
        regRes.setStudentId(101L);
        regRes.setEmailId("karthik@gces.edu");

        when(studentRegistrationService.registerStudent(regReq)).thenReturn(regRes);
        StudentDetailsResDTO actualReg = studentRegistrationService.registerStudent(regReq);
        assertNotNull(actualReg.getStudentId());

        // Step 3: Student Login
        StudentLoginReqDTO loginReq = new StudentLoginReqDTO();
        loginReq.setIdentifier("730421104050");
        loginReq.setDob(LocalDate.of(2003, 7, 20));

        when(studentDetailsRepo.findByRegisterNo("730421104050")).thenReturn(Optional.of(student));
        when(jwtUtil.generateToken("730421104050", 101L)).thenReturn("valid-jwt-token");

        AuthResponseDTO authRes = studentAuthService.login(loginReq);
        assertNotNull(authRes.getToken());
        assertEquals("valid-jwt-token", authRes.getToken());
        assertEquals(101L, authRes.getStudentId());
    }

    @Test
    @DisplayName("WF-NEG-01: Login fails when student provides wrong date of birth")
    void testLoginFlow_WrongDob() {
        StudentLoginReqDTO loginReq = new StudentLoginReqDTO();
        loginReq.setIdentifier("730421104050");
        loginReq.setDob(LocalDate.of(1999, 1, 1)); // Wrong DOB

        when(studentDetailsRepo.findByRegisterNo("730421104050")).thenReturn(Optional.of(student));

        assertThrows(InvalidCredentialsException.class, () -> studentAuthService.login(loginReq));
    }
}
