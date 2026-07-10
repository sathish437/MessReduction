package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.StudentVerificationServiceUnavailableException;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.Gender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentVerificationServiceTest {

    @Mock
    private WebClient webClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    private StudentVerificationService studentVerificationService;
    private StudentDetailsReqDTO studentDto;

    @BeforeEach
    void setUp() {
        studentVerificationService = new StudentVerificationService(
                webClient,
                "https://3dbarath-gcesjar.hf.space/api/auth/verify-details",
                "password",
                true
        );

        studentDto = new StudentDetailsReqDTO();
        studentDto.setRollNo("22CSE01");
        studentDto.setRegisterNo("71782201");
        studentDto.setGender(Gender.MALE);
        studentDto.setDepartment(Department.CSE);
    }

    @SuppressWarnings("unchecked")
    @Test
    void testVerifyStudent_Success() {
        // Arrange
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(Boolean.class)).thenReturn(Mono.just(true));

        // Act
        boolean result = studentVerificationService.verifyStudent(studentDto);

        // Assert
        assertTrue(result);
    }

    @SuppressWarnings("unchecked")
    @Test
    void testVerifyStudent_Failure() {
        // Arrange
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(Boolean.class)).thenReturn(Mono.just(false));

        // Act
        boolean result = studentVerificationService.verifyStudent(studentDto);

        // Assert
        assertFalse(result);
    }

    @SuppressWarnings("unchecked")
    @Test
    void testVerifyStudent_ThrowsException_WhenUnavailable() {
        // Arrange
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(Boolean.class)).thenReturn(Mono.error(new RuntimeException("Connection refused")));

        // Act & Assert
        StudentVerificationServiceUnavailableException exception = assertThrows(
                StudentVerificationServiceUnavailableException.class,
                () -> studentVerificationService.verifyStudent(studentDto)
        );

        assertTrue(exception.getMessage().contains("External verification service is currently unavailable"));
    }

    @Test
    void testVerifyStudent_Disabled() {
        // Arrange
        StudentVerificationService serviceDisabled = new StudentVerificationService(
                webClient,
                "https://example.com/api/auth/verify-details",
                "password",
                false
        );

        // Act
        boolean result = serviceDisabled.verifyStudent(studentDto);

        // Assert
        assertTrue(result);
        verifyNoInteractions(webClient);
    }
}
