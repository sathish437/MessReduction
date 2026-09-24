package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hostel.MessReduction.DTO.ReqDTO.ActivityLogRequest;
import com.hostel.MessReduction.DTO.ResDTO.ActivityLogResponse;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Service.ActivityLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ActivityLogControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private ActivityLogController activityLogController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(activityLogController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("WF-HAPPY-04 Step 4: POST /api/logs creates audit log for staff role")
    void testCreateLog_Success() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "warden", "pass", List.of(new SimpleGrantedAuthority("ROLE_Warden")));

        ActivityLogRequest req = new ActivityLogRequest();
        req.setFormId(501L);
        req.setStudentId(101L);
        req.setStudentName("Karthik");
        req.setDepartment("CSE");
        req.setStaffRole(Role.Warden);
        req.setStaffName("warden");
        req.setAction("Approved");
        req.setArrivalDate(LocalDate.now().plusDays(4));
        req.setYear(2);

        ActivityLogResponse res = new ActivityLogResponse();
        res.setId(10L);
        res.setStaffName("warden");
        res.setStaffRole(Role.Warden);
        res.setAction("Approved");

        when(activityLogService.createLog(any(ActivityLogRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.staffName").value("warden"));
    }

    @Test
    @DisplayName("WF-HAPPY-04: GET /api/logs/my-logs retrieves staff personal activity logs")
    void testGetMyLogs() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "warden", "pass", List.of(new SimpleGrantedAuthority("ROLE_Warden")));

        ActivityLogResponse res = new ActivityLogResponse();
        res.setId(10L);
        res.setStaffName("warden");
        res.setAction("Approved");

        when(activityLogService.findActiveLogsByStaffName("warden")).thenReturn(List.of(res));

        mockMvc.perform(get("/api/logs/my-logs").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].staffName").value("warden"));
    }
}
