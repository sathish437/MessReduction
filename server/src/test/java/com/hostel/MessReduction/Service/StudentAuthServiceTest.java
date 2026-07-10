package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.Repo.StudentDetailsRepo;
import com.hostel.MessReduction.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentAuthServiceTest {

    @Mock
    private StudentDetailsRepo studentDetailsRepo;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private StudentAuthService studentAuthService;

    private StudentLoginReqDTO reqDto;
    private StudentDetails student;

    @BeforeEach
    void setUp() {
        reqDto = new StudentLoginReqDTO();
        reqDto.setIdentifier("22CSE01");
        reqDto.setDob(LocalDate.of(2004, 5, 18));

        student = new StudentDetails();
        student.setStudentId(1L);
        student.setName("Alice");
        student.setRegisterNo("22CSE01");
        student.setRollNo("22R001");
        student.setDob(LocalDate.of(2004, 5, 18));
    }

    @Test
    void testLogin_SuccessWithRegisterNo() {
        // Arrange
        when(studentDetailsRepo.findByRegisterNo("22CSE01")).thenReturn(Optional.of(student));
        when(jwtUtil.generateToken("22CSE01", 1L)).thenReturn("mock-jwt-token");

        // Act
        AuthResponseDTO result = studentAuthService.login(reqDto);

        // Assert
        assertNotNull(result);
        assertEquals("mock-jwt-token", result.getToken());
        assertEquals(1L, result.getStudentId());
        assertEquals("Alice", result.getName());
        assertEquals("22CSE01", result.getRegisterNo());
        assertEquals("22R001", result.getRollNo());

        verify(studentDetailsRepo, times(1)).findByRegisterNo("22CSE01");
        verify(studentDetailsRepo, never()).findByRollNo(anyString());
        verify(jwtUtil, times(1)).generateToken("22CSE01", 1L);
    }

    @Test
    void testLogin_SuccessWithRollNo() {
        // Arrange
        reqDto.setIdentifier("22R001");
        when(studentDetailsRepo.findByRegisterNo("22R001")).thenReturn(Optional.empty());
        when(studentDetailsRepo.findByRollNo("22R001")).thenReturn(Optional.of(student));
        when(jwtUtil.generateToken("22CSE01", 1L)).thenReturn("mock-jwt-token");

        // Act
        AuthResponseDTO result = studentAuthService.login(reqDto);

        // Assert
        assertNotNull(result);
        assertEquals("mock-jwt-token", result.getToken());
        assertEquals(1L, result.getStudentId());
        assertEquals("Alice", result.getName());
        assertEquals("22CSE01", result.getRegisterNo());
        assertEquals("22R001", result.getRollNo());

        verify(studentDetailsRepo, times(1)).findByRegisterNo("22R001");
        verify(studentDetailsRepo, times(1)).findByRollNo("22R001");
        verify(jwtUtil, times(1)).generateToken("22CSE01", 1L);
    }

    @Test
    void testLogin_InvalidIdentifier() {
        // Arrange
        when(studentDetailsRepo.findByRegisterNo("22CSE01")).thenReturn(Optional.empty());
        when(studentDetailsRepo.findByRollNo("22CSE01")).thenReturn(Optional.empty());

        // Act & Assert
        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> studentAuthService.login(reqDto)
        );

        assertEquals("Invalid Register Number/Roll Number or Date of Birth", exception.getMessage());
        verify(studentDetailsRepo, times(1)).findByRegisterNo("22CSE01");
        verify(studentDetailsRepo, times(1)).findByRollNo("22CSE01");
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void testLogin_MismatchedDob() {
        // Arrange
        reqDto.setDob(LocalDate.of(2004, 5, 19)); // Wrong DOB
        when(studentDetailsRepo.findByRegisterNo("22CSE01")).thenReturn(Optional.of(student));

        // Act & Assert
        InvalidCredentialsException exception = assertThrows(
                InvalidCredentialsException.class,
                () -> studentAuthService.login(reqDto)
        );

        assertEquals("Invalid Register Number/Roll Number or Date of Birth", exception.getMessage());
        verify(studentDetailsRepo, times(1)).findByRegisterNo("22CSE01");
        verify(studentDetailsRepo, never()).findByRollNo(anyString());
        verifyNoInteractions(jwtUtil);
    }
}
