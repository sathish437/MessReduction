package com.hostel.MessReduction;

import com.hostel.MessReduction.DTO.ResDTO.ReductionFormResDTO;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.StudentDetails;
import com.hostel.MessReduction.MappingDTO.ReductionFormMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class OfficeReportCalculationTest {

    private ReductionForm createForm(String studentName, LocalDate leave, LocalDate arrival, Long dbStoredHolidays) {
        StudentDetails student = new StudentDetails();
        student.setName(studentName);
        student.setDepartment("CSE");
        student.setRegisterNo("REG_" + studentName.replace(" ", ""));

        ReductionForm form = new ReductionForm();
        form.setFormId(999L);
        form.setStudentDetails(student);
        form.setLeaveDate(leave);
        form.setArrivalDate(arrival);
        form.setTotalHolidays(dbStoredHolidays);
        form.setCurrentStatus(FormStatus.Approved);
        return form;
    }

    @Test
    @DisplayName("Office Report with N=3: Arjun Kumar (15-Nov to 18-Nov) -> 1 holiday (Nov: 1)")
    void testArjunKumar_N3() {
        ReductionForm form = createForm("Arjun Kumar", LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 18), 3L);
        ReductionFormResDTO dto = ReductionFormMapper.mapToOfficeReportDTO(form, 3);

        assertNotNull(dto);
        assertEquals(1L, dto.getTotalHolidays());
        assertEquals("Nov: 1", dto.getMonthWiseHolidays());
    }

    @Test
    @DisplayName("Office Report with N=3: Deepika Singh (16-Nov to 19-Nov) -> 1 holiday (Nov: 1)")
    void testDeepikaSingh_N3() {
        ReductionForm form = createForm("Deepika Singh", LocalDate.of(2026, 11, 16), LocalDate.of(2026, 11, 19), 3L);
        ReductionFormResDTO dto = ReductionFormMapper.mapToOfficeReportDTO(form, 3);

        assertNotNull(dto);
        assertEquals(1L, dto.getTotalHolidays());
        assertEquals("Nov: 1", dto.getMonthWiseHolidays());
    }

    @Test
    @DisplayName("Office Report with N=3: Deepak Subramanian (17-Nov to 20-Nov) -> 1 holiday (Nov: 1)")
    void testDeepakSubramanian_N3() {
        ReductionForm form = createForm("Deepak Subramanian", LocalDate.of(2026, 11, 17), LocalDate.of(2026, 11, 20), 3L);
        ReductionFormResDTO dto = ReductionFormMapper.mapToOfficeReportDTO(form, 3);

        assertNotNull(dto);
        assertEquals(1L, dto.getTotalHolidays());
        assertEquals("Nov: 1", dto.getMonthWiseHolidays());
    }

    @Test
    @DisplayName("Office Report with N=3: Sathish (13-Nov to 13-Dec) -> 28 holidays (Nov: 15, Dec: 13), sum=28")
    void testSathish_N3() {
        ReductionForm form = createForm("Sathish", LocalDate.of(2026, 11, 13), LocalDate.of(2026, 12, 13), 27L);
        ReductionFormResDTO dto = ReductionFormMapper.mapToOfficeReportDTO(form, 3);

        assertNotNull(dto);
        // Inclusive days = 31, 31 - 3 = 28
        assertEquals(28L, dto.getTotalHolidays());
        assertEquals("Nov: 15, Dec: 13", dto.getMonthWiseHolidays());
    }

    @Test
    @DisplayName("Dynamic Admin Setting: When N=2, Arjun=2 (Nov: 2), Sathish=29 (Nov: 16, Dec: 13)")
    void testDynamicSetting_N2() {
        ReductionForm arjun = createForm("Arjun Kumar", LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 18), 3L);
        ReductionFormResDTO arjunDto = ReductionFormMapper.mapToOfficeReportDTO(arjun, 2);
        assertEquals(2L, arjunDto.getTotalHolidays());
        assertEquals("Nov: 2", arjunDto.getMonthWiseHolidays());

        ReductionForm sathish = createForm("Sathish", LocalDate.of(2026, 11, 13), LocalDate.of(2026, 12, 13), 27L);
        ReductionFormResDTO sathishDto = ReductionFormMapper.mapToOfficeReportDTO(sathish, 2);
        assertEquals(29L, sathishDto.getTotalHolidays());
        assertEquals("Nov: 16, Dec: 13", sathishDto.getMonthWiseHolidays());
    }

    @Test
    @DisplayName("Dynamic Admin Setting: When N=0, Arjun=4 (Nov: 4), Sathish=31 (Nov: 18, Dec: 13)")
    void testDynamicSetting_N0() {
        ReductionForm arjun = createForm("Arjun Kumar", LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 18), 3L);
        ReductionFormResDTO arjunDto = ReductionFormMapper.mapToOfficeReportDTO(arjun, 0);
        assertEquals(4L, arjunDto.getTotalHolidays());
        assertEquals("Nov: 4", arjunDto.getMonthWiseHolidays());

        ReductionForm sathish = createForm("Sathish", LocalDate.of(2026, 11, 13), LocalDate.of(2026, 12, 13), 27L);
        ReductionFormResDTO sathishDto = ReductionFormMapper.mapToOfficeReportDTO(sathish, 0);
        assertEquals(31L, sathishDto.getTotalHolidays());
        assertEquals("Nov: 18, Dec: 13", sathishDto.getMonthWiseHolidays());
    }
}

