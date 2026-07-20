package com.hostel.MessReduction.DTO.ResDTO;

import com.hostel.MessReduction.Entity.Department;
import com.hostel.MessReduction.Entity.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponseDTO {
    private Long studentId;
    private String name;
    private String registerNo;
    private String rollNo;
    private Department department;
    private Gender gender;
    private LocalDate dob;
    private String emailId;
    private String phoneNo;
    private Integer currentYear;
}
