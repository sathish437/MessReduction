package com.hostel.MessReduction.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.hostel.MessReduction.Entity.Gender;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudentDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long studentId;
    @NotBlank
    @Column(nullable = false)
    private String name;
    @NotBlank
    @Column(nullable = false, unique = true, length = 20)
    private String registerNo;
    @NotBlank
    @Column(nullable = false, unique = true, length = 20)
    private String rollNo;
    @Enumerated(EnumType.STRING)
    @NotNull
    @Column(nullable = false)
    private Department department;
    @Enumerated(EnumType.STRING)
    private Gender gender;
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

    @OneToMany(mappedBy = "studentDetails", fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<ReductionForm> reductionForms;
}
