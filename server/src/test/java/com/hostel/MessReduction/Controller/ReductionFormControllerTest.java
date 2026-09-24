package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hostel.MessReduction.DTO.ReqDTO.ReductionFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Service.ExtraSubmissionService;
import com.hostel.MessReduction.Service.ReductionFormService;
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
import java.time.LocalTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReductionFormControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private ReductionFormService reductionFormService;

    @Mock
    private ExtraSubmissionService extraSubmissionService;

    @InjectMocks
    private ReductionFormController reductionFormController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reductionFormController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("WF-BND-31: GET /api/student-form/server-time returns server time in IST")
    void testGetServerTime() throws Exception {
        mockMvc.perform(get("/api/student-form/server-time"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timeZone").value("Asia/Kolkata"))
                .andExpect(jsonPath("$.serverDate").isNotEmpty());
    }

    @Test
    @DisplayName("WF-HAPPY-03: POST /api/student-form/StudentForm/{studentId} submits form")
    void testStudentSubmitForm_Success() throws Exception {
        ReductionFormReqDTO req = new ReductionFormReqDTO();
        req.setYear(2);
        req.setRoomNo(205L);
        req.setLeaveDate(LocalDate.now().plusDays(1));
        req.setLeaveTime(LocalTime.of(9, 0));
        req.setArrivalDate(LocalDate.now().plusDays(4));
        req.setArrivalTime(LocalTime.of(18, 0));
        req.setReason("Symposium");

        ReductionFormResDTO res = new ReductionFormResDTO();
        res.setFormId(501L);
        res.setYear(2);
        res.setRoomNo(205L);
        res.setCurrentStatus(FormStatus.PendingDeputyWarden);

        when(reductionFormService.formSubmit(any(ReductionFormReqDTO.class), eq(101L))).thenReturn(res);

        mockMvc.perform(post("/api/student-form/StudentForm/101")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formId").value(501))
                .andExpect(jsonPath("$.currentStatus").value("PendingDeputyWarden"));
    }

    @Test
    @DisplayName("WF-HAPPY-03 Step 9: GET /api/student-form/StudentForm/{studentId} returns forms")
    void testGetStudentForms() throws Exception {
        ReductionFormResDTO form = new ReductionFormResDTO();
        form.setFormId(501L);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);

        when(reductionFormService.formDetails(101L)).thenReturn(List.of(form));

        mockMvc.perform(get("/api/student-form/StudentForm/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].formId").value(501));
    }

    @Test
    @DisplayName("WF-HAPPY-19: DELETE /api/student-form/StudentForm/{studentId}/{formId} soft-deletes form")
    void testDeleteStudentForm() throws Exception {
        mockMvc.perform(delete("/api/student-form/StudentForm/101/501"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Request deleted successfully"));

        verify(reductionFormService).deleteStudentRequest(501L, 101L);
    }

    @Test
    @DisplayName("WF-HAPPY-20: POST /api/student-form/StudentForm/{studentId}/{formId}/resubmit resubmits form")
    void testResubmitStudentForm() throws Exception {
        ReductionFormReqDTO req = new ReductionFormReqDTO();
        req.setYear(2);
        req.setRoomNo(205L);
        req.setLeaveDate(LocalDate.now().plusDays(2));
        req.setLeaveTime(LocalTime.of(9, 0));
        req.setArrivalDate(LocalDate.now().plusDays(5));
        req.setArrivalTime(LocalTime.of(18, 0));
        req.setReason("Corrected dates for symposium");

        ReductionFormResDTO res = new ReductionFormResDTO();
        res.setFormId(501L);
        res.setCurrentStatus(FormStatus.PendingDeputyWarden);

        when(reductionFormService.resubmitForm(eq(501L), eq(101L), any(ReductionFormReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/student-form/StudentForm/101/501/resubmit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.formId").value(501))
                .andExpect(jsonPath("$.currentStatus").value("PendingDeputyWarden"));
    }
}
