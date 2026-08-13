package com.hostel.MessReduction.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reduction_form_history", indexes = {
        @Index(name = "idx_rfh_form_id", columnList = "form_id"),
        @Index(name = "idx_rfh_event_timestamp", columnList = "eventTimestamp")
})
public class ReductionFormHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    @JsonIgnore
    private ReductionForm reductionForm;

    @Enumerated(EnumType.STRING)
    private FormStatus fromStatus;

    @Enumerated(EnumType.STRING)
    private FormStatus toStatus;

    private String eventType;

    private String performedBy;

    @Column(length = 1000)
    private String comment;

    private LocalDateTime eventTimestamp;

    private boolean isActive = true;
}
