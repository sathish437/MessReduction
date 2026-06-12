package com.hostel.MessReduction.DTO.ResDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.hostel.MessReduction.Entity.FormStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ReductionFormHistoryResDTO {
    private Long id;
    private Long formId;
    private FormStatus fromStatus;
    private FormStatus toStatus;
    private String eventType;
    private String performedBy;
    private String comment;
 
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime eventTimestamp;
}
