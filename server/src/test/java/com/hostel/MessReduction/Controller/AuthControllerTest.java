package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hostel.MessReduction.DTO.ReqDTO.HostelVerifyReqDTO;
import com.hostel.MessReduction.DTO.ReqDTO.StudentLoginReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import com.hostel.MessReduction.DTO.ResDTO.HostelVerifyResDTO;
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

import java.time.LocalDate;

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

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("WF-HAPPY-01 Step 1: GET /api/auth/hostel-verification-status returns verification state")
    void testGetHostelVerificationStatus_Enabled() throws Exception {
        when(studentVerificationService.isEnabled()).thenReturn(true);

        mockMvc.perform(get("/api/auth/hostel-verification-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    @DisplayName("WF-ALT-01 Step 1: GET /api/auth/hostel-verification-status returns disabled state")
    void testGetHostelVerificationStatus_Disabled() throws Exception {
        when(studentVerificationService.isEnabled()).thenReturn(false);

        mockMvc.perform(get("/api/auth/hostel-verification-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
    }

    @Test
    @DisplayName("WF-HAPPY-01 Step 3: POST /api/auth/verify-hostel returns verified details")
    void testVerifyHostel_Success() throws Exception {
        HostelVerifyReqDTO req = new HostelVerifyReqDTO();
        req.setRegisterNo("730421104001");
        req.setPassword("pass123");

        HostelVerifyResDTO res = new HostelVerifyResDTO();
        res.setVerified(true);
        res.setRegisterNo("730421104001");
        res.setName("Arun Kumar");
        res.setDepartment("CSE");

        when(studentVerificationService.verifyHostelCredentials(any(HostelVerifyReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/auth/verify-hostel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.registerNo").value("730421104001"))
                .andExpect(jsonPath("$.name").value("Arun Kumar"))
                .andExpect(jsonPath("$.department").value("CSE"));
    }

    @Test
    @DisplayName("WF-HAPPY-02 Step 2: POST /api/auth/login returns JWT token & student info")
    void testLogin_Success() throws Exception {
        StudentLoginReqDTO req = new StudentLoginReqDTO();
        req.setIdentifier("730421104001");
        req.setDob(LocalDate.of(2003, 5, 15));

        AuthResponseDTO res = new AuthResponseDTO();
        res.setToken("mock-jwt-token-string");
        res.setStudentId(101L);
        res.setRegisterNo("730421104001");

        when(studentAuthService.login(any(StudentLoginReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token-string"))
                .andExpect(jsonPath("$.studentId").value(101));
    }
}
