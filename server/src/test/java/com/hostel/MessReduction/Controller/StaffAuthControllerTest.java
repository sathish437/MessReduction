package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hostel.MessReduction.DTO.ReqDTO.StaffUsersReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StaffLoginResDTO;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Service.StaffAuthService;
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
class StaffAuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private StaffAuthService staffAuthService;

    @InjectMocks
    private StaffAuthController staffAuthController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(staffAuthController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("WF-HAPPY-12: POST /api/staff/login returns JWT token & staff info")
    void testStaffLogin_Success() throws Exception {
        StaffUsersReqDTO req = new StaffUsersReqDTO();
        req.setRole(Role.Warden);
        req.setUserName("warden");
        req.setPassword("warden123");

        StaffLoginResDTO res = new StaffLoginResDTO();
        res.setToken("mock-warden-jwt-token");
        res.setUsername("warden");
        res.setRole(Role.Warden);

        when(staffAuthService.login(any(StaffUsersReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/staff/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-warden-jwt-token"))
                .andExpect(jsonPath("$.username").value("warden"))
                .andExpect(jsonPath("$.role").value("Warden"));
    }

    @Test
    @DisplayName("WF-NEG-25: GET /api/staff/validate without security context returns 401")
    void testValidateToken_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/staff/validate"))
                .andExpect(status().isUnauthorized());
    }
}
