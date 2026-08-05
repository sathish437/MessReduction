package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "activity_log")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long formId;
    private Long studentId;
    private String studentName;
    private String department;

    @Enumerated(EnumType.STRING)
    private Role staffRole;

    private String staffName;
    private String action;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    private LocalDate arrivalDate;

    private boolean isActive = true;

    private String ipAddress;
}
