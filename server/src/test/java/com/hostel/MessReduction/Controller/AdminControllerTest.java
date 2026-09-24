package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hostel.MessReduction.DTO.ReqDTO.StudentRequestDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentResponseDTO;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Service.AdminService;
import com.hostel.MessReduction.Service.ExtraSubmissionService;
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
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminService adminService;

    @Mock
    private ExtraSubmissionService extraSubmissionService;

    @InjectMocks
    private AdminController adminController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("WF-HAPPY-13: POST /api/admin/students creates student")
    void testCreateStudent() throws Exception {
        StudentRequestDTO req = new StudentRequestDTO();
        req.setName("Deepak");
        req.setRegisterNo("730421104005");
        req.setRollNo("21CS005");
        req.setEmailId("deepak@gmail.com");
        req.setPhoneNo("9876543215");
        req.setGender(Gender.MALE);
        req.setCurrentYear(2);
        req.setDepartment("CSE");
        req.setDob(LocalDate.of(2004, 3, 20));

        StudentResponseDTO res = new StudentResponseDTO();
        res.setStudentId(205L);
        res.setName("Deepak");
        res.setRegisterNo("730421104005");

        when(adminService.createStudent(any(StudentRequestDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/admin/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value(205))
                .andExpect(jsonPath("$.name").value("Deepak"));
    }

    @Test
    @DisplayName("WF-HAPPY-10: POST /api/admin/extra-submissions/{id}/approve approves extra submission")
    void testApproveExtraSubmission() throws Exception {
        mockMvc.perform(post("/api/admin/extra-submissions/10/approve"))
                .andExpect(status().isOk());

        verify(extraSubmissionService).approveRequest(10L, "MasterAdmin");
    }

    @Test
    @DisplayName("WF-HAPPY-18: POST /api/admin/truncate-transactional-data truncates records")
    void testTruncateTransactionalData() throws Exception {
        when(adminService.truncateTransactionalData()).thenReturn(Map.of("message", "All transactional data truncated successfully"));

        mockMvc.perform(post("/api/admin/truncate-transactional-data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All transactional data truncated successfully"));
    }

    @Test
    @DisplayName("WF-HAPPY-16: PUT /api/admin/settings/reminder-offset updates reminder offset")
    void testUpdateReminderOffset() throws Exception {
        when(adminService.updateReminderOffsetDays(2)).thenReturn(2);

        mockMvc.perform(put("/api/admin/settings/reminder-offset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reminderDays", 2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reminderDays").value(2));
    }
}
