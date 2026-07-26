package com.hostel.MessReduction.Service;

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
        when(studentDetailsService.addStudent(reqDto)).thenReturn(resDto);

        // Act
        StudentDetailsResDTO result = studentRegistrationService.registerStudent(reqDto);

        // Assert
        assertNotNull(result);
        assertEquals("test@student.com", result.getEmailId());
        verify(studentDetailsService, times(1)).addStudent(reqDto);
    }
}
