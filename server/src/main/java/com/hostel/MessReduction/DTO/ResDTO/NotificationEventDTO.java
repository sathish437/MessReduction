package com.hostel.MessReduction.DTO.ResDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal payload for Server-Sent Events (SSE) notifications.
 * Contains only authorized application summary data.
 * Does not expose phone number, gender, or unnecessary personal info.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationEventDTO {
    private Long applicationId;
    private String studentName;
    private String registerNumber;
    private String department;
    private Integer yearOfStudy;
}
