package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "fcm_tokens", indexes = {
        @Index(name = "idx_fcm_username", columnList = "username"),
        @Index(name = "idx_fcm_token", columnList = "token"),
        @Index(name = "idx_fcm_active", columnList = "active")
})
public class FcmToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String token;

    @Column(length = 50)
    private String platform = "web";

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public FcmToken(String username, String token, String platform) {
        this.username = username;
        this.token = token;
        this.platform = platform != null ? platform : "web";
        this.active = true;
    }
}
