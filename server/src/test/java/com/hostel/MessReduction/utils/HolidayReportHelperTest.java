package com.hostel.MessReduction.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class HolidayReportHelperTest {

    @Test
    @DisplayName("TC-1: Same-month new request: 15-Nov to 18-Nov, N=3 -> Nov: 1 (Arjun Kumar)")
    void testSameMonthNewRequest_ArjunKumar() {
        LocalDate leaveDate = LocalDate.of(2026, 11, 15);
        LocalDate arrivalDate = LocalDate.of(2026, 11, 18);
        Long totalHolidays = 1L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Nov: 1", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-1b: Historical record: 15-Nov to 18-Nov, stored total = 3 -> Nov: 3")
    void testSameMonthHistoricalRequest_ArjunKumar() {
        LocalDate leaveDate = LocalDate.of(2026, 11, 15);
        LocalDate arrivalDate = LocalDate.of(2026, 11, 18);
        Long totalHolidays = 3L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Nov: 3", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-1b: Same-month request: 16-Nov to 19-Nov -> Nov: 3 (Deepika Singh)")
    void testSameMonthRequest_DeepikaSingh() {
        LocalDate leaveDate = LocalDate.of(2026, 11, 16);
        LocalDate arrivalDate = LocalDate.of(2026, 11, 19);
        Long totalHolidays = 3L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Nov: 3", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-1c: Same-month request: 17-Nov to 20-Nov -> Nov: 3 (Deepak Subramanian)")
    void testSameMonthRequest_DeepakSubramanian() {
        LocalDate leaveDate = LocalDate.of(2026, 11, 17);
        LocalDate arrivalDate = LocalDate.of(2026, 11, 20);
        Long totalHolidays = 3L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Nov: 3", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-2: Cross-month request: 13-Nov to 13-Dec, N=3 -> Nov: 14, Dec: 13 (Sathish)")
    void testCrossMonthRequest_Sathish() {
        LocalDate leaveDate = LocalDate.of(2026, 11, 13);
        LocalDate arrivalDate = LocalDate.of(2026, 12, 13);
        Long totalHolidays = 27L;

        // Base: Nov 14..30 = 17 days, Dec 1..13 = 13 days, Total base = 30 days.
        // Deduction N = 3 applied to Nov: Nov = 17 - 3 = 14, Dec = 13.
        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Nov: 14, Dec: 13", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-3: Cross-year request: December to January")
    void testCrossYearRequest_DecemberToJanuary() {
        LocalDate leaveDate = LocalDate.of(2026, 12, 20);
        LocalDate arrivalDate = LocalDate.of(2027, 1, 10);
        // Base: Dec 21..31 = 11 days, Jan 1..10 = 10 days. Total base = 21 days.
        // If N = 3, Total holidays = 18 days.
        // Dec = 11 - 3 = 8, Jan = 10.
        Long totalHolidays = 18L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Dec: 8, Jan: 10", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-4: Request spanning three months: October to December")
    void testRequestSpanningThreeMonths() {
        LocalDate leaveDate = LocalDate.of(2026, 10, 15);
        LocalDate arrivalDate = LocalDate.of(2026, 12, 10);
        // Base: Oct 16..31 = 16 days, Nov 1..30 = 30 days, Dec 1..10 = 10 days. Total base = 56 days.
        // If N = 3, Total holidays = 53 days.
        // Oct = 16 - 3 = 13, Nov = 30, Dec = 10.
        Long totalHolidays = 53L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Oct: 13, Nov: 30, Dec: 10", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-5a: Different Admin deduction values: N=0 (No deduction)")
    void testDifferentDeduction_ZeroDeduction() {
        LocalDate leaveDate = LocalDate.of(2026, 11, 13);
        LocalDate arrivalDate = LocalDate.of(2026, 12, 13);
        // Base: Nov 17, Dec 13 = 30 days.
        // If N = 0, Total holidays = 30.
        Long totalHolidays = 30L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Nov: 17, Dec: 13", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-5b: Different Admin deduction values: N=5 (5-day deduction)")
    void testDifferentDeduction_FiveDayDeduction() {
        LocalDate leaveDate = LocalDate.of(2026, 11, 13);
        LocalDate arrivalDate = LocalDate.of(2026, 12, 13);
        // Base: Nov 17, Dec 13 = 30 days.
        // If N = 5, Total holidays = 25.
        // Nov = 17 - 5 = 12, Dec = 13.
        Long totalHolidays = 25L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Nov: 12, Dec: 13", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-5c: Deduction exceeds first month days: N=20 (Cascade deduction)")
    void testDifferentDeduction_CascadeDeduction() {
        LocalDate leaveDate = LocalDate.of(2026, 11, 13);
        LocalDate arrivalDate = LocalDate.of(2026, 12, 13);
        // Base: Nov 17, Dec 13 = 30 days.
        // If N = 20, Total holidays = 10.
        // Nov = 17 - 17 = 0 (omitted from output).
        // Dec = 13 - 3 = 10.
        Long totalHolidays = 10L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Dec: 10", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-6: Leap year February: 2028-02-25 to 2028-03-05")
    void testLeapYearFebruary() {
        LocalDate leaveDate = LocalDate.of(2028, 2, 25);
        LocalDate arrivalDate = LocalDate.of(2028, 3, 5);
        // 2028 is a leap year (Feb has 29 days).
        // Feb 26, 27, 28, 29 = 4 days.
        // Mar 1..5 = 5 days. Total base = 9 days.
        // If N = 3, Total holidays = 6.
        // Feb = 4 - 3 = 1, Mar = 5.
        Long totalHolidays = 6L;

        String result = HolidayReportHelper.calculateMonthWiseHolidays(leaveDate, arrivalDate, totalHolidays);

        assertEquals("Feb: 1, Mar: 5", result);
        assertSumEqualsTotal(result, totalHolidays);
    }

    @Test
    @DisplayName("TC-7: Edge cases: Nulls, zeros, equal dates")
    void testEdgeCases() {
        assertEquals("", HolidayReportHelper.calculateMonthWiseHolidays(null, LocalDate.of(2026, 11, 18), 3L));
        assertEquals("", HolidayReportHelper.calculateMonthWiseHolidays(LocalDate.of(2026, 11, 15), null, 3L));
        assertEquals("", HolidayReportHelper.calculateMonthWiseHolidays(LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 18), null));
        assertEquals("", HolidayReportHelper.calculateMonthWiseHolidays(LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 18), 0L));
        assertEquals("", HolidayReportHelper.calculateMonthWiseHolidays(LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 18), -5L));
        assertEquals("", HolidayReportHelper.calculateMonthWiseHolidays(LocalDate.of(2026, 11, 18), LocalDate.of(2026, 11, 15), 3L));
        assertEquals("Nov: 1", HolidayReportHelper.calculateMonthWiseHolidays(LocalDate.of(2026, 11, 15), LocalDate.of(2026, 11, 15), 1L));
    }

    private void assertSumEqualsTotal(String monthWiseResult, Long totalHolidays) {
        if (monthWiseResult == null || monthWiseResult.isEmpty()) {
            assertEquals(0L, totalHolidays != null ? totalHolidays : 0L);
            return;
        }

        long sum = 0;
        String[] parts = monthWiseResult.split(", ");
        for (String part : parts) {
            String[] kv = part.split(": ");
            assertEquals(2, kv.length, "Each part must be of form 'MMM: count'");
            sum += Long.parseLong(kv[1].trim());
        }

        assertEquals(totalHolidays.longValue(), sum, "Sum of monthly values must equal totalHolidays");
    }
}

