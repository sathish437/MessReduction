package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "auto_accept_settings",
    indexes = {
        @Index(name = "idx_username", columnList = "username"),
        @Index(name = "idx_enabled_dates", columnList = "enabled, fromDate, toDate")
    }
)
public class AutoAcceptSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 20)
    private String role; // "DEPUTY_WARDEN" or "WARDEN"

    @Column(nullable = false)
    private boolean enabled;

    @Column(nullable = false)
    private LocalDate fromDate;

    @Column(nullable = false)
    private LocalDate toDate;

    @Column(length = 50)
    private String department;

    @Column(length = 20)
    private String year;

    @Column(length = 500)
    private String reason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
