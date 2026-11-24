package com.hostel.MessReduction.Entity.readonly;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

@Getter
@NoArgsConstructor
@Entity
@Immutable
@Table(name = "students")
public class HostelStudent {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "dept")
    private String dept;

    @Column(name = "year")
    private Integer year;

    @Column(name = "gender")
    private String gender;

    @Column(name = "student_type")
    private String studentType;
}
