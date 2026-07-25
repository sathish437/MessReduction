package com.hostel.MessReduction.DTO.ReqDTO;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentVerificationRequestDTO {
    private String rollNo;
    private String registerNo;
    private String regNo;
    private String gender;
    private String dept;
    private String department;
}
