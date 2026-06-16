package com.hostel.MessReduction.DTO.ReqDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RejectFormReqDTO {

    @NotBlank(message = "Reject reason cannot be null or empty")
    @Size(max = 1000, message = "Reject reason cannot exceed 1000 characters")
    private String rejectReason;
}
