package com.hostel.MessReduction.DTO.ReqDTO;

import com.hostel.MessReduction.Entity.Department;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StudentDetailsReqDTO {
    @NotBlank
    private String name;
    @NotBlank
    private String registerNo;
    @NotBlank
    private String rollNo;
    @NotNull
    private Date dob;
    @NotBlank
    private String phoneNo;
    @Email
    @NotBlank
    private String emailId;
    @NotNull
    private Department department;
}
