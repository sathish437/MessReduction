package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hostel.MessReduction.DTO.ReqDTO.RejectFormReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Service.ReductionFormService;
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

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class StaffUsersControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private ReductionFormService reductionFormService;

    @InjectMocks
    private StaffUsersController staffUsersController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(staffUsersController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("WF-HAPPY-04 Step 1: GET /api/hostelStaff/staff/deputyWarden returns pending forms")
    void testGetDeputyWardenPendingForms() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "deputyWarden1", "password", List.of(new SimpleGrantedAuthority("ROLE_DeputyWarden")));

        ReductionFormResDTO form = new ReductionFormResDTO();
        form.setFormId(501L);
        form.setCurrentStatus(FormStatus.PendingDeputyWarden);

        when(reductionFormService.deputyWardenPendingStatus("deputyWarden1")).thenReturn(List.of(form));

        mockMvc.perform(get("/api/hostelStaff/staff/deputyWarden").principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].formId").value(501))
                .andExpect(jsonPath("$[0].currentStatus").value("PendingDeputyWarden"));
    }

    @Test
    @DisplayName("WF-HAPPY-04 Step 3: PATCH /api/hostelStaff/staff/deputyWarden/{formId}?action=accept approves form")
    void testUpdateDeputyWarden_Accept() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "deputyWarden1", "password", List.of(new SimpleGrantedAuthority("ROLE_DeputyWarden")));

        mockMvc.perform(patch("/api/hostelStaff/staff/deputyWarden/501")
                        .param("action", "accept")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(content().string("DeputyWarden status updated successfully"));

        verify(reductionFormService).updateDeputyWardenPendingStatus(501L, "accept", "deputyWarden1");
    }

    @Test
    @DisplayName("WF-HAPPY-04 Step 6: PATCH /api/hostelStaff/staff/warden/{formId}?action=accept approves form")
    void testUpdateWarden_Accept() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "warden", "password", List.of(new SimpleGrantedAuthority("ROLE_Warden")));

        mockMvc.perform(patch("/api/hostelStaff/staff/warden/501")
                        .param("action", "accept")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(content().string("Warden status updated successfully"));

        verify(reductionFormService).updateWardenPendingStatus(501L, "accept", "warden");
    }

    @Test
    @DisplayName("WF-HAPPY-04 Step 9: PATCH /api/hostelStaff/staff/office/{formId}?action=accept final approval")
    void testUpdateOffice_Accept() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "office", "password", List.of(new SimpleGrantedAuthority("ROLE_Office")));

        mockMvc.perform(patch("/api/hostelStaff/staff/office/501")
                        .param("action", "accept")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(content().string("Office status updated successfully"));

        verify(reductionFormService).updateOfficePendingStatus(501L, "accept", "office");
    }

    @Test
    @DisplayName("WF-STATE-04: PATCH /api/hostelStaff/staff/deputyWarden/{formId}/reject rejects form with reason")
    void testRejectDeputyWarden_WithReason() throws Exception {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "deputyWarden1", "password", List.of(new SimpleGrantedAuthority("ROLE_DeputyWarden")));

        RejectFormReqDTO req = new RejectFormReqDTO();
        req.setRejectReason("Incomplete event documentation");

        mockMvc.perform(patch("/api/hostelStaff/staff/deputyWarden/501/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(content().string("Form rejected by deputy warden successfully"));

        verify(reductionFormService).rejectDeputyWardenForm(501L, "Incomplete event documentation", "deputyWarden1");
    }

    @Test
    @DisplayName("WF-HAPPY-11: GET /api/hostelStaff/staff/office/download-report generates Excel spreadsheet")
    void testDownloadReport_Success() throws Exception {
        ReductionFormResDTO form = new ReductionFormResDTO();
        form.setFormId(501L);
        form.setCurrentStatus(FormStatus.Approved);

        when(reductionFormService.getOfficeReportData()).thenReturn(List.of(form));

        mockMvc.perform(get("/api/hostelStaff/staff/office/download-report"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("attachment; filename=mess_reduction_report.xlsx")))
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }
}
