package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.StudentDetails;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface StudentDetailsRepo extends JpaRepository<StudentDetails,Long>, JpaSpecificationExecutor<StudentDetails> {
    Boolean existsByEmailId(String email);
    StudentDetails findByEmailId(String emailId);
    Optional<StudentDetails> findByEmailIdAndDob(String emailId, LocalDate dob);
    Optional<StudentDetails> findByRegisterNo(String registerNo);
    Optional<StudentDetails> findByRegisterNoAndDob(String registerNo, LocalDate dob);
    Optional<StudentDetails> findByRollNo(String rollNo);

    Long countByCreatedAtBetween(java.time.LocalDateTime startOfDay, java.time.LocalDateTime endOfDay);

    @org.springframework.data.jpa.repository.Query("SELECT s.department.departmentCode, COUNT(s) FROM StudentDetails s GROUP BY s.department.departmentCode")
    List<Object[]> countStudentsByDepartment();
}
