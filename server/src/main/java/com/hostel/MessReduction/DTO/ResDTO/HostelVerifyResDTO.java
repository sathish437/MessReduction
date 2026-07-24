package com.hostel.MessReduction.DTO.ResDTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostelVerifyResDTO {
    private boolean verified;
    private String rollNo;
    private String registerNo;
    private String name;
    private String department;
    private String gender;
    private String message;
}
