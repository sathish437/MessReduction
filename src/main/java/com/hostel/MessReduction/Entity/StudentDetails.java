package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class StudentDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long studentId;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Column(nullable = false,unique = true,length = 12)
    private String registerNo;

    @NotBlank
    @Column(nullable = false,unique = true,length = 8)
    private String rollNo;

    @NotBlank
    @Column(nullable = false,length = 52)
    private String department;

    @NotNull
    @Column(nullable = false)
    private LocalDate dob;

    @NotBlank
    @Column(nullable = false,unique = true)
    @Email
    private String emailId;

    @NotBlank
    @Column(nullable = false,unique = true,length = 10)
    private String phoneNo;
}
