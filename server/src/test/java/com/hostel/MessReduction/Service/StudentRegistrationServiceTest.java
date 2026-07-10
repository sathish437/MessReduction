package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.StudentVerificationFailedException;
import com.hostel.MessReduction.CustomException.StudentVerificationServiceUnavailableException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentRegistrationServiceTest {

    @Mock
    private StudentVerificationService studentVerificationService;

    @Mock
    private StudentDetailsService studentDetailsService;

    @InjectMocks
    private StudentRegistrationService studentRegistrationService;

    private StudentDetailsReqDTO reqDto;
    private StudentDetailsResDTO resDto;

    @BeforeEach
    void setUp() {
        reqDto = new StudentDetailsReqDTO();
        reqDto.setRollNo("22CSE01");
        reqDto.setRegisterNo("71782201");

        resDto = new StudentDetailsResDTO();
        resDto.setEmailId("test@student.com");
    }

    @Test
    void testRegisterStudent_Success() {
        // Arrange
        when(studentVerificationService.verifyStudent(reqDto)).thenReturn(true);
        when(studentDetailsService.addStudent(reqDto)).thenReturn(resDto);

        // Act
        StudentDetailsResDTO result = studentRegistrationService.registerStudent(reqDto);

        // Assert
        assertNotNull(result);
        assertEquals("test@student.com", result.getEmailId());
        verify(studentVerificationService, times(1)).verifyStudent(reqDto);
        verify(studentDetailsService, times(1)).addStudent(reqDto);
    }

    @Test
    void testRegisterStudent_VerificationFailed() {
        // Arrange
        when(studentVerificationService.verifyStudent(reqDto)).thenReturn(false);

        // Act & Assert
        StudentVerificationFailedException exception = assertThrows(
                StudentVerificationFailedException.class,
                () -> studentRegistrationService.registerStudent(reqDto)
        );

        assertEquals("Student details verification failed. Account cannot be created.", exception.getMessage());
        verify(studentVerificationService, times(1)).verifyStudent(reqDto);
        verify(studentDetailsService, never()).addStudent(any());
    }

    @Test
    void testRegisterStudent_ServiceUnavailable() {
        // Arrange
        when(studentVerificationService.verifyStudent(reqDto))
                .thenThrow(new StudentVerificationServiceUnavailableException(
                        "External verification service is currently unavailable. Please try again later."));

        // Act & Assert
        StudentVerificationServiceUnavailableException exception = assertThrows(
                StudentVerificationServiceUnavailableException.class,
                () -> studentRegistrationService.registerStudent(reqDto)
        );

        assertEquals("External verification service is currently unavailable. Please try again later.", exception.getMessage());
        verify(studentVerificationService, times(1)).verifyStudent(reqDto);
        verify(studentDetailsService, never()).addStudent(any());
    }
}
