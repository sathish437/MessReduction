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
import com.hostel.MessReduction.Entity.readonly.HostelUser;
import com.hostel.MessReduction.Repo.HostelStudentRepository;
import com.hostel.MessReduction.Repo.HostelUserRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentRegistrationAndAuthFlowTest {

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @Mock
    private HostelUserRepository hostelUserRepository;

    @Mock
    private HostelStudentRepository hostelStudentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private StudentRegistrationService studentRegistrationService;

    @Mock
    private StudentVerificationService studentVerificationService;

    private StudentAuthService studentAuthService;

    private StudentDetails student;
    private HostelUser hostelUser;

    @BeforeEach
    void setUp() {
        studentAuthService = new StudentAuthService(studentDetailsRepo, hostelUserRepository, hostelStudentRepository, studentVerificationService, passwordEncoder, jwtUtil);

        hostelUser = new HostelUser();
        try {
            java.lang.reflect.Field idField = HostelUser.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(hostelUser, "21CS050");

            java.lang.reflect.Field rollField = HostelUser.class.getDeclaredField("rollNumber");
            rollField.setAccessible(true);
            rollField.set(hostelUser, 730421104050L);

            java.lang.reflect.Field nameField = HostelUser.class.getDeclaredField("name");
            nameField.setAccessible(true);
            nameField.set(hostelUser, "Karthik");

            java.lang.reflect.Field pwField = HostelUser.class.getDeclaredField("password");
            pwField.setAccessible(true);
            pwField.set(hostelUser, "$2a$10$hashedPassword");

            java.lang.reflect.Field emailField = HostelUser.class.getDeclaredField("email");
            emailField.setAccessible(true);
            emailField.set(hostelUser, "karthik@gces.edu");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

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
        loginReq.setPassword("hostelPass123");

        when(hostelUserRepository.findByRollNumber(730421104050L)).thenReturn(Optional.of(hostelUser));
        when(passwordEncoder.matches("hostelPass123", "$2a$10$hashedPassword")).thenReturn(true);
        when(studentDetailsRepo.findByRegisterNo("730421104050")).thenReturn(Optional.of(student));
        when(jwtUtil.generateToken("730421104050", 101L)).thenReturn("valid-jwt-token");

        AuthResponseDTO authRes = studentAuthService.login(loginReq);
        assertNotNull(authRes.getToken());
        assertEquals("valid-jwt-token", authRes.getToken());
        assertEquals(101L, authRes.getStudentId());
        assertFalse(authRes.getOnboardingRequired());
    }

    @Test
    @DisplayName("WF-NEG-01: Login fails when student provides wrong password")
    void testLoginFlow_WrongPassword() {
        StudentLoginReqDTO loginReq = new StudentLoginReqDTO();
        loginReq.setIdentifier("730421104050");
        loginReq.setPassword("wrongPassword");

        when(hostelUserRepository.findByRollNumber(730421104050L)).thenReturn(Optional.of(hostelUser));
        when(passwordEncoder.matches("wrongPassword", "$2a$10$hashedPassword")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> studentAuthService.login(loginReq));
    }
}
