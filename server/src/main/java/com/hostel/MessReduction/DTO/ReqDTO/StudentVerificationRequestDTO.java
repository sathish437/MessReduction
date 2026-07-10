package com.hostel.MessReduction.DTO.ReqDTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StudentVerificationRequestDTO {
    private String rollNo;
    private String registerNo;
    private String gender;
    private String dept;
}
