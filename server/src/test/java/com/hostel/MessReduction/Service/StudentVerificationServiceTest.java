package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
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
    private HostelVerifyReqDTO hostelReqDto;

    @BeforeEach
    void setUp() {
        studentVerificationService = new StudentVerificationService(
                webClient,
                "https://hostel-api.gces.net.in/api/auth/verify-details",
                "password",
                true
        );

        hostelReqDto = new HostelVerifyReqDTO();
        hostelReqDto.setRegisterNo("830122104001");
        hostelReqDto.setPassword("hostelpass123");
    }

    @SuppressWarnings("unchecked")
    @Test
    void testVerifyHostelCredentials_Success() {
        // Arrange
        String jsonResponse = "{\"verified\":true,\"registerNo\":\"830122104001\",\"name\":\"Test Student\",\"department\":\"CSE\"}";
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just(jsonResponse));

        // Act
        HostelVerifyResDTO response = studentVerificationService.verifyHostelCredentials(hostelReqDto);

        // Assert
        assertNotNull(response);
        assertTrue(response.isVerified());
        assertEquals("830122104001", response.getRegisterNo());
    }

    @SuppressWarnings("unchecked")
    @Test
    void testVerifyHostelCredentials_Failure() {
        // Arrange
        String jsonResponse = "{\"verified\":false,\"message\":\"Invalid Register Number or Password.\"}";
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just(jsonResponse));

        // Act
        HostelVerifyResDTO response = studentVerificationService.verifyHostelCredentials(hostelReqDto);

        // Assert
        assertNotNull(response);
        assertFalse(response.isVerified());
    }
}
