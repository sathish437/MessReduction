package com.hostel.MessReduction.DTO.ResDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentTrackingEventDTO {
    private Long formId;
    private Long studentId;
    private String currentStage; // SUBMITTED, DEPUTY_WARDEN, WARDEN, OFFICE, COMPLETED, REJECTED
    private String currentStatus; // PendingDeputyWarden, PendingWarden, PendingOffice, Approved, Rejected*
    private String message;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    private RequestTrackingResDTO tracking;
}
