package com.hostel.MessReduction.utils;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Utility for calculating month-wise holiday breakdown for Office Dashboard Reports.
 *
 * Business Rules:
 * - Leave Date and Arrival Date form an inclusive calendar-day range.
 * - Days are split across calendar months.
 * - Admin deduction N is applied to the beginning of the date range (earliest month's allocation).
 * - N is NOT deducted from Arrival Date or final month's allocation.
 * - Months with 0 holidays are excluded.
 * - Sum of all month-wise values strictly equals total holidays.
 */
public final class HolidayReportHelper {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);

    private HolidayReportHelper() {
        // Prevent instantiation
    }

    /**
     * Calculates the month-wise holiday breakdown formatted as a display string
     * e.g., "Nov: 14, Dec: 13", "Nov: 1", "Nov: 20, Dec: 15, Jan: 10".
     *
     * @param leaveDate     start date of leave (inclusive)
     * @param arrivalDate   end date of leave / arrival (inclusive)
     * @param totalHolidays total holiday count from the form
     * @return formatted month-wise breakdown string, or empty string if no holidays
     */
    public static String calculateMonthWiseHolidays(LocalDate leaveDate, LocalDate arrivalDate, Long totalHolidays) {
        if (leaveDate == null || arrivalDate == null || totalHolidays == null || totalHolidays <= 0) {
            return "";
        }

        LocalDate startDate = leaveDate;
        LocalDate endDate = arrivalDate;

        if (startDate.isAfter(endDate)) {
            return "";
        }

        // 1. Calculate base days per calendar month within the date range
        Map<YearMonth, Long> monthlyBaseDays = new LinkedHashMap<>();
        LocalDate current = startDate;

        while (!current.isAfter(endDate)) {
            YearMonth ym = YearMonth.from(current);
            LocalDate endOfMonth = ym.atEndOfMonth();
            LocalDate chunkEnd = endOfMonth.isBefore(endDate) ? endOfMonth : endDate;
            long daysInChunk = ChronoUnit.DAYS.between(current, chunkEnd) + 1;
            monthlyBaseDays.put(ym, daysInChunk);
            current = chunkEnd.plusDays(1);
        }

        long totalBaseDays = 0;
        for (long d : monthlyBaseDays.values()) {
            totalBaseDays += d;
        }

        // 2. Determine target holidays and deduction N
        long targetHolidays = Math.max(0, Math.min(totalHolidays, totalBaseDays));
        long remainingDeduction = Math.max(0, totalBaseDays - targetHolidays);

        // 3. Apply deduction starting from the beginning (first month's allocation)
        Map<YearMonth, Long> finalMonthlyAllocation = new LinkedHashMap<>();
        for (Map.Entry<YearMonth, Long> entry : monthlyBaseDays.entrySet()) {
            YearMonth ym = entry.getKey();
            long base = entry.getValue();
            long deduct = Math.min(base, remainingDeduction);
            long allocated = base - deduct;
            remainingDeduction -= deduct;
            if (allocated > 0) {
                finalMonthlyAllocation.put(ym, allocated);
            }
        }

        // 4. Format into readable string "MMM: count, MMM: count"
        List<String> parts = new ArrayList<>();
        for (Map.Entry<YearMonth, Long> entry : finalMonthlyAllocation.entrySet()) {
            String monthName = entry.getKey().format(MONTH_FORMATTER);
            parts.add(monthName + ": " + entry.getValue());
        }

        return String.join(", ", parts);
    }
}

