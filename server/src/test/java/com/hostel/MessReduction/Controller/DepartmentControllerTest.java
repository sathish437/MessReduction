package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostel.MessReduction.DTO.ReqDTO.DepartmentReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.DepartmentResDTO;
import com.hostel.MessReduction.Service.DepartmentService;
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

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DepartmentControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private DepartmentService departmentService;

    @InjectMocks
    private DepartmentController departmentController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(departmentController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("WF-HAPPY-15 Step 1: POST /api/departments creates department")
    void testCreateDepartment() throws Exception {
        DepartmentReqDTO req = new DepartmentReqDTO();
        req.setDepartmentCode("CSE");
        req.setDepartmentName("Computer Science and Engineering");
        req.setShortName("CSE");
        req.setDisplayOrder(1);

        DepartmentResDTO res = DepartmentResDTO.builder()
                .id(1L)
                .departmentCode("CSE")
                .departmentName("Computer Science and Engineering")
                .isActive(true)
                .build();

        when(departmentService.createDepartment(any(DepartmentReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/departments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.departmentCode").value("CSE"))
                .andExpect(jsonPath("$.isActive").value(true));
    }

    @Test
    @DisplayName("WF-STATE-19: PATCH /api/departments/{id}/status toggles active status")
    void testToggleDepartment() throws Exception {
        DepartmentResDTO res = DepartmentResDTO.builder()
                .id(1L)
                .departmentCode("CSE")
                .isActive(false)
                .build();

        when(departmentService.toggleDepartmentStatus(eq(1L), eq(false))).thenReturn(res);

        mockMvc.perform(patch("/api/departments/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("isActive", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isActive").value(false));
    }

    @Test
    @DisplayName("WF-STATE-20: GET /api/departments/active returns only active departments")
    void testGetActiveDepartments() throws Exception {
        DepartmentResDTO dept = DepartmentResDTO.builder()
                .id(1L)
                .departmentCode("CSE")
                .isActive(true)
                .build();

        when(departmentService.getActiveDepartments()).thenReturn(List.of(dept));

        mockMvc.perform(get("/api/departments/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].departmentCode").value("CSE"))
                .andExpect(jsonPath("$[0].isActive").value(true));
    }
}
