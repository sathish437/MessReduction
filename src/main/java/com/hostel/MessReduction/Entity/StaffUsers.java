package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class StaffUsers {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;
    @NotBlank
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    @NotBlank
    @Column(length = 50,nullable = false)
    private String userName;
    @NotBlank
    @Column(length = 100,nullable = false)
    private String password;
    @NotBlank
    @Email
    @Column(length = 100,nullable = false)
    private String gmail;
}
