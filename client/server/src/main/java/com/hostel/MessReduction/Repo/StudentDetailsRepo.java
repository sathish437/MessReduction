package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.StudentDetails;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface StudentDetailsRepo extends JpaRepository<StudentDetails,Long> {
    Boolean existsByEmailId(String email);
    StudentDetails findByEmailId(String emailId);
    Optional<StudentDetails> findByEmailIdAndDob(String emailId, LocalDate dob);
}
