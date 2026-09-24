package com.hostel.MessReduction.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hostel.MessReduction.DTO.ReqDTO.StudentDetailsReqDTO;
import com.hostel.MessReduction.DTO.ResDTO.StudentDetailsResDTO;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Service.StudentRegistrationService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class StudentDetailsControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private StudentRegistrationService studentRegistrationService;

    @InjectMocks
    private StudentDetailsController studentDetailsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(studentDetailsController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("WF-HAPPY-01 Step 6: POST /api/student/reg successfully registers student")
    void testRegisterStudent_Success() throws Exception {
        StudentDetailsReqDTO req = new StudentDetailsReqDTO();
        req.setName("Sathish Kumar");
        req.setRegisterNo("730421104001");
        req.setRollNo("21CS001");
        req.setEmailId("sathish@gmail.com");
        req.setPhoneNo("9876543210");
        req.setGender(Gender.MALE);
        req.setDepartment("CSE");
        req.setDob(LocalDate.of(2003, 5, 15));

        StudentDetailsResDTO res = new StudentDetailsResDTO();
        res.setStudentId(101L);
        res.setEmailId("sathish@gmail.com");

        when(studentRegistrationService.registerStudent(any(StudentDetailsReqDTO.class))).thenReturn(res);

        mockMvc.perform(post("/api/student/reg")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentId").value(101))
                .andExpect(jsonPath("$.emailId").value("sathish@gmail.com"));
    }
}
