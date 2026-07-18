package com.hostel.MessReduction.DTO.ReqDTO;

import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentRequestDTO {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Register number is required")
    private String registerNo;

    @NotBlank(message = "Roll number is required")
    private String rollNo;

    @NotNull(message = "Department is required")
    private Department department;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Date of Birth is required")
    private LocalDate dob;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String emailId;

    @NotBlank(message = "Phone number is required")
    private String phoneNo;
}
