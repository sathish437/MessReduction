package com.hostel.MessReduction.Flow;

import com.hostel.MessReduction.CustomException.StudentVerificationServiceUnavailableException;
import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
import com.hostel.MessReduction.Service.StudentVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExternalApiFaultToleranceFlowTest {

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

    @BeforeEach
    void setUp() {
        studentVerificationService = new StudentVerificationService(
                webClient,
                "https://hostel-api.gces.net.in/verify",
                "test-api-key",
                true // Enabled
        );
    }

    private void setupWebClientChain() {
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    @DisplayName("WF-NEG-03: External Hostel API network failure throws StudentVerificationServiceUnavailableException")
    void testHostelApi_NetworkTimeoutOrDisconnect_ThrowsServiceUnavailable() {
        setupWebClientChain();
        when(responseSpec.bodyToMono(String.class))
                .thenThrow(new WebClientRequestException(new java.net.ConnectException("Connection refused"),
                        org.springframework.http.HttpMethod.POST,
                        java.net.URI.create("https://hostel-api.gces.net.in/verify"),
                        org.springframework.http.HttpHeaders.EMPTY));

        HostelVerifyReqDTO req = new HostelVerifyReqDTO();
        req.setRegisterNo("730421104050");
        req.setPassword("password123");

        StudentVerificationServiceUnavailableException ex = assertThrows(
                StudentVerificationServiceUnavailableException.class,
                () -> studentVerificationService.verifyHostelCredentials(req)
        );
        assertTrue(ex.getMessage().contains("Unable to connect to the College Hostel Verification Server"));
    }

    @Test
    @DisplayName("WF-NEG-04: External Hostel API returns 401/403 credentials error gracefully handled")
    void testHostelApi_InvalidCredentials4xx_ReturnsGracefulFailedDTO() {
        setupWebClientChain();
        when(responseSpec.bodyToMono(String.class))
                .thenThrow(new WebClientResponseException(401, "Unauthorized", org.springframework.http.HttpHeaders.EMPTY, null, null));

        HostelVerifyReqDTO req = new HostelVerifyReqDTO();
        req.setRegisterNo("730421104050");
        req.setPassword("wrongpass");

        HostelVerifyResDTO res = studentVerificationService.verifyHostelCredentials(req);
        assertNotNull(res);
        assertFalse(res.isVerified());
        assertTrue(res.getMessage().contains("Register Number or Password you entered is incorrect"));
    }

    @Test
    @DisplayName("WF-INT-01: External Hostel API 500 server error triggers service unavailable")
    void testHostelApi_ServerError500_ThrowsServiceUnavailable() {
        setupWebClientChain();
        when(responseSpec.bodyToMono(String.class))
                .thenThrow(new WebClientResponseException(500, "Internal Server Error", org.springframework.http.HttpHeaders.EMPTY, null, null));

        HostelVerifyReqDTO req = new HostelVerifyReqDTO();
        req.setRegisterNo("730421104050");
        req.setPassword("password123");

        assertThrows(StudentVerificationServiceUnavailableException.class,
                () -> studentVerificationService.verifyHostelCredentials(req));
    }
}
