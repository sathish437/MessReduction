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
    Boolean existsByRollNo(String rollNo);
    Boolean existsByRegisterNo(String registerNo);
    Boolean existsByPhoneNo(String phoneNo);
    StudentDetails findByEmailId(String emailId);
    Optional<StudentDetails> findByEmailIdAndDob(String emailId, LocalDate dob);
    Optional<StudentDetails> findByRegisterNo(String registerNo);
    Optional<StudentDetails> findByRegisterNoAndDob(String registerNo, LocalDate dob);
    Optional<StudentDetails> findByRollNo(String rollNo);

    Long countByCreatedAtBetween(java.time.LocalDateTime startOfDay, java.time.LocalDateTime endOfDay);

    @org.springframework.data.jpa.repository.Query("SELECT s.department, COUNT(s) FROM StudentDetails s GROUP BY s.department")
    List<Object[]> countStudentsByDepartment();

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("DELETE FROM StudentDetails s WHERE s.studentId IN :studentIds")
    int deleteStudentsByIdsIn(@org.springframework.data.repository.query.Param("studentIds") List<Long> studentIds);
}
