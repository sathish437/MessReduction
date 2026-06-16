package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class AppNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipientUsername; // Can be a specific studentId/userName or a generic Role like "Warden"

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private String type; // "NORMAL_REQUEST", "EMERGENCY_REQUEST", "APPROVED", "REJECTED", "REMINDER"

    @Column(nullable = false)
    private boolean isRead = false;

    private Long relatedFormId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
