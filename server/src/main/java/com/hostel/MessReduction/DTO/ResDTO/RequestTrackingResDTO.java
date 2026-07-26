package com.hostel.MessReduction.DTO.ResDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RequestTrackingResDTO {
    private String currentStage; // SUBMITTED, DEPUTY_WARDEN, WARDEN, OFFICE, COMPLETED
    private String currentStatus; // The actual string from FormStatus enum
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedTime;
    
    private String deputyWardenName;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deputyApprovalTime;
    
    private String wardenName;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime wardenApprovalTime;
    
    private String officeName;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime officeApprovalTime;
    
    private String rejectionReason;
    private String rejectedBy; // Which role rejected it
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime rejectedTime;

    private boolean isAutoAccepted;
}
