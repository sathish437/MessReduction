package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Entity.readonly.HostelStudent;
import com.hostel.MessReduction.Entity.readonly.HostelUser;
import com.hostel.MessReduction.Repo.HostelStudentRepository;
import com.hostel.MessReduction.Repo.HostelUserRepository;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentAuthServiceTest {

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

    @InjectMocks
    private StudentAuthService studentAuthService;

    private StudentLoginReqDTO reqDto;
    private StudentDetails student;
    private HostelUser hostelUser;

    @BeforeEach
    void setUp() {
        reqDto = new StudentLoginReqDTO();
        reqDto.setIdentifier("730421104001");
        reqDto.setPassword("hostelPassword");

        hostelUser = new HostelUser();
        // Since HostelUser has private fields without setters, we can use reflection or test data
        try {
            java.lang.reflect.Field idField = HostelUser.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(hostelUser, "21CS001");

            java.lang.reflect.Field rollField = HostelUser.class.getDeclaredField("rollNumber");
            rollField.setAccessible(true);
            rollField.set(hostelUser, 730421104001L);

            java.lang.reflect.Field nameField = HostelUser.class.getDeclaredField("name");
            nameField.setAccessible(true);
            nameField.set(hostelUser, "Alice");

            java.lang.reflect.Field pwField = HostelUser.class.getDeclaredField("password");
            pwField.setAccessible(true);
            pwField.set(hostelUser, "$2a$10$hashedPassword");

            java.lang.reflect.Field emailField = HostelUser.class.getDeclaredField("email");
            emailField.setAccessible(true);
            emailField.set(hostelUser, "alice@gces.edu.in");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        student = new StudentDetails();
        student.setStudentId(1L);
        student.setName("Alice");
        student.setRegisterNo("730421104001");
        student.setRollNo("21CS001");
        student.setDob(LocalDate.of(2004, 5, 18));
        student.setPhoneNo("9876543210");
    }

    @Test
    void testLogin_SuccessExistingStudent_NoOnboarding() {
        when(hostelUserRepository.findByRollNumber(730421104001L)).thenReturn(Optional.of(hostelUser));
        when(passwordEncoder.matches("hostelPassword", "$2a$10$hashedPassword")).thenReturn(true);
        when(studentDetailsRepo.findByRegisterNo("730421104001")).thenReturn(Optional.of(student));
        when(jwtUtil.generateToken("730421104001", 1L)).thenReturn("mock-jwt-token");

        AuthResponseDTO result = studentAuthService.login(reqDto);

        assertNotNull(result);
        assertEquals("mock-jwt-token", result.getToken());
        assertEquals(1L, result.getStudentId());
        assertEquals("Alice", result.getName());
        assertEquals("730421104001", result.getRegisterNo());
        assertEquals("21CS001", result.getRollNo());
        assertFalse(result.getOnboardingRequired());

        verify(hostelUserRepository, times(1)).findByRollNumber(730421104001L);
        verify(passwordEncoder, times(1)).matches("hostelPassword", "$2a$10$hashedPassword");
        verify(jwtUtil, times(1)).generateToken("730421104001", 1L);
    }

    @Test
    void testLogin_SuccessNewStudent_RequiresOnboarding() {
        when(hostelUserRepository.findByRollNumber(730421104001L)).thenReturn(Optional.of(hostelUser));
        when(passwordEncoder.matches("hostelPassword", "$2a$10$hashedPassword")).thenReturn(true);
        when(studentDetailsRepo.findByRegisterNo("730421104001")).thenReturn(Optional.empty());
        when(studentDetailsRepo.findByRollNo(anyString())).thenReturn(Optional.empty());

        StudentDetails savedStudent = new StudentDetails();
        savedStudent.setStudentId(2L);
        savedStudent.setName("Alice");
        savedStudent.setRegisterNo("730421104001");
        savedStudent.setRollNo("21CS001");
        when(studentDetailsRepo.save(any(StudentDetails.class))).thenReturn(savedStudent);
        when(jwtUtil.generateToken("730421104001", 2L)).thenReturn("mock-jwt-token-new");

        AuthResponseDTO result = studentAuthService.login(reqDto);

        assertNotNull(result);
        assertEquals("mock-jwt-token-new", result.getToken());
        assertEquals(2L, result.getStudentId());
        assertTrue(result.getOnboardingRequired());

        verify(studentDetailsRepo, times(1)).save(any(StudentDetails.class));
    }

    @Test
    void testLogin_UserNotFoundInHostelDb() {
        when(hostelUserRepository.findByRollNumber(730421104001L)).thenReturn(Optional.empty());
        when(hostelUserRepository.findById("730421104001")).thenReturn(Optional.empty());

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> studentAuthService.login(reqDto)
        );

        assertTrue(exception.getMessage().contains("Invalid credentials"));
        verifyNoInteractions(passwordEncoder);
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void testLogin_PasswordMismatch() {
        when(hostelUserRepository.findByRollNumber(730421104001L)).thenReturn(Optional.of(hostelUser));
        when(passwordEncoder.matches("hostelPassword", "$2a$10$hashedPassword")).thenReturn(false);

        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> studentAuthService.login(reqDto)
        );

        assertTrue(exception.getMessage().contains("Invalid credentials"));
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void testLoginBySsoIdentifier_Success() {
        when(hostelUserRepository.findByRollNumber(730421104001L)).thenReturn(Optional.of(hostelUser));
        when(studentDetailsRepo.findByRegisterNo("730421104001")).thenReturn(Optional.of(student));
        when(jwtUtil.generateToken("730421104001", 1L)).thenReturn("sso-jwt-token");

        AuthResponseDTO result = studentAuthService.loginBySsoIdentifier("730421104001");

        assertNotNull(result);
        assertEquals("sso-jwt-token", result.getToken());
        assertEquals("730421104001", result.getRegisterNo());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void testLoginBySsoIdentifier_DisabledAccount() throws Exception {
        java.lang.reflect.Field enabledField = HostelUser.class.getDeclaredField("isEnabled");
        enabledField.setAccessible(true);
        enabledField.set(hostelUser, false);

        when(hostelUserRepository.findByRollNumber(730421104001L)).thenReturn(Optional.of(hostelUser));

        InvalidCredentialsException ex = assertThrows(
                InvalidCredentialsException.class,
                () -> studentAuthService.loginBySsoIdentifier("730421104001")
        );
        assertTrue(ex.getMessage().contains("disabled"));
    }
}
