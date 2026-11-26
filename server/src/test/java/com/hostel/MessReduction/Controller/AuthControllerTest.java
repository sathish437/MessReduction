package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.SsoExchangeReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
import com.hostel.MessReduction.Service.HostelSsoService;
import com.hostel.MessReduction.Service.StudentAuthService;
import com.hostel.MessReduction.Service.StudentVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private StudentAuthService studentAuthService;

    @Mock
    private StudentVerificationService studentVerificationService;

    @Mock
    private HostelSsoService hostelSsoService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("WF-HAPPY-01 Step 1: POST /api/auth/verify-hostel successfully verifies student credentials")
    void testVerifyHostel_Success() throws Exception {
        HostelVerifyReqDTO req = new HostelVerifyReqDTO();
        req.setRegisterNo("730421104001");
        req.setPassword("hostelPass123");

        HostelVerifyResDTO res = HostelVerifyResDTO.builder()
                .verified(true)
                .name("Sathish Kumar")
                .registerNo("730421104001")
                .rollNo("21CS001")
                .emailId("sathish@gmail.com")
                .department("CSE")
                .currentYear(3)
                .gender("MALE")
                .build();

        when(studentVerificationService.verifyHostelCredentials(any(HostelVerifyReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/auth/verify-hostel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.name").value("Sathish Kumar"))
                .andExpect(jsonPath("$.registerNo").value("730421104001"));
    }

    @Test
    @DisplayName("WF-HAPPY-01 Step 2: GET /api/auth/hostel-verification-status returns status")
    void testGetHostelVerificationStatus() throws Exception {
        when(studentVerificationService.isEnabled()).thenReturn(true);

        mockMvc.perform(get("/api/auth/hostel-verification-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    @DisplayName("WF-HAPPY-01 Step 3: verifyHostel returns pre-filled details for registration")
    void testVerifyHostel_PrefilledDetails() throws Exception {
        HostelVerifyReqDTO req = new HostelVerifyReqDTO();
        req.setRegisterNo("730421104002");
        req.setPassword("password123");

        HostelVerifyResDTO res = HostelVerifyResDTO.builder()
                .verified(true)
                .name("Arun Kumar")
                .registerNo("730421104002")
                .rollNo("21CS002")
                .emailId("arun@gmail.com")
                .department("CSE")
                .currentYear(4)
                .gender("MALE")
                .build();

        when(studentVerificationService.verifyHostelCredentials(any(HostelVerifyReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/auth/verify-hostel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Arun Kumar"))
                .andExpect(jsonPath("$.department").value("CSE"));
    }

    @Test
    @DisplayName("WF-HAPPY-02 Step 2: POST /api/auth/login returns JWT token & student info")
    void testLogin_Success() throws Exception {
        StudentLoginReqDTO req = new StudentLoginReqDTO();
        req.setIdentifier("730421104001");
        req.setPassword("secretPassword");

        AuthResponseDTO res = new AuthResponseDTO();
        res.setToken("mock-jwt-token-string");
        res.setStudentId(101L);
        res.setRegisterNo("730421104001");
        res.setOnboardingRequired(false);

        when(studentAuthService.login(any(StudentLoginReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token-string"))
                .andExpect(jsonPath("$.studentId").value(101));
    }

    @Test
    @DisplayName("POST /api/auth/hostel-sso redirects to /sso-callback?code=... on valid signature")
    void testHostelSso_SuccessRedirect() throws Exception {
        when(hostelSsoService.verifyAndCreateSsoCode("1700000000", "nonce-1", "730421104001", "sig-hex"))
                .thenReturn("one-time-code-xyz");
        when(hostelSsoService.buildFrontendRedirectUrl("/sso-callback?code=one-time-code-xyz"))
                .thenReturn("/sso-callback?code=one-time-code-xyz");

        mockMvc.perform(post("/api/auth/hostel-sso")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("ts", "1700000000")
                        .param("nonce", "nonce-1")
                        .param("regno", "730421104001")
                        .param("sig", "sig-hex"))
                .andExpect(status().isFound())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string("Location", "/sso-callback?code=one-time-code-xyz"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string("Cache-Control", "no-store"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string("Referrer-Policy", "no-referrer"));
    }

    @Test
    @DisplayName("POST /api/auth/hostel-sso redirects to /student-login?error=... on SSO failure")
    void testHostelSso_FailureRedirect() throws Exception {
        when(hostelSsoService.verifyAndCreateSsoCode("1700000000", "nonce-1", "730421104001", "bad"))
                .thenThrow(new HostelSsoService.SsoException("sso_invalid_signature", "Invalid SSO signature."));
        when(hostelSsoService.buildFrontendRedirectUrl("/student-login?error=sso_invalid_signature"))
                .thenReturn("/student-login?error=sso_invalid_signature");

        mockMvc.perform(post("/api/auth/hostel-sso")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("ts", "1700000000")
                        .param("nonce", "nonce-1")
                        .param("regno", "730421104001")
                        .param("sig", "bad"))
                .andExpect(status().isFound())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string("Location", "/student-login?error=sso_invalid_signature"));
    }

    @Test
    @DisplayName("POST /api/auth/sso-exchange exchanges one-time code for JWT session")
    void testSsoExchange_Success() throws Exception {
        SsoExchangeReqDTO req = new SsoExchangeReqDTO("one-time-code-xyz");
        AuthResponseDTO res = new AuthResponseDTO("mock-jwt-token", 101L, "Alice", "730421104001", "21CS001", false);

        when(hostelSsoService.exchangeCode("one-time-code-xyz")).thenReturn(res);

        mockMvc.perform(post("/api/auth/sso-exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.studentId").value(101))
                .andExpect(jsonPath("$.registerNo").value("730421104001"));
    }
}
