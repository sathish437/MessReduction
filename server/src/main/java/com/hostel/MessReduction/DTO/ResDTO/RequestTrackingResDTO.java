package com.hostel.MessReduction.DTO.ResDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RequestTrackingResDTO {
    private String currentStage; // SUBMITTED, DEPUTY_WARDEN, WARDEN, OFFICE, COMPLETED
    private String currentStatus; // The actual string from FormStatus enum
    
    private LocalDateTime submittedTime;
    
    private String deputyWardenName;
    private LocalDateTime deputyApprovalTime;
    
    private String wardenName;
    private LocalDateTime wardenApprovalTime;
    
    private String officeName;
    private LocalDateTime officeApprovalTime;
    
    private String rejectionReason;
    private String rejectedBy; // Which role rejected it
    private LocalDateTime rejectedTime;

    private boolean isAutoAccepted;
}
