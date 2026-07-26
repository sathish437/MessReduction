package com.hostel.MessReduction.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true, length = 50)
    private String departmentCode;

    @NotBlank
    @Column(nullable = false, unique = true, length = 150)
    private String departmentName;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String shortName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer displayOrder = 0;

    @Column(nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Department(Long id, String departmentCode, String departmentName, String shortName) {
        this.id = id;
        this.departmentCode = departmentCode;
        this.departmentName = departmentName;
        this.shortName = shortName;
        this.isActive = true;
        this.displayOrder = 0;
    }
}
