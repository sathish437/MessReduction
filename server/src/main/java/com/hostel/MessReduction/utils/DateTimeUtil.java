package com.hostel.MessReduction.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Standard utility providing consistent Indian Standard Time (Asia/Kolkata)
 * clocks and dates across the entire MessReduction platform.
 */
public final class DateTimeUtil {

    public static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");
    public static final String IST_ZONE_ID = "Asia/Kolkata";

    private DateTimeUtil() {
        // Prevent instantiation
    }

    /**
     * Returns the current date in Asia/Kolkata time zone.
     */
    public static LocalDate nowLocalDate() {
        return LocalDate.now(IST_ZONE);
    }

    /**
     * Returns the current date-time in Asia/Kolkata time zone.
     */
    public static LocalDateTime nowLocalDateTime() {
        return LocalDateTime.now(IST_ZONE);
    }
}
