package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.ExtraSubmissionRequest;
import com.hostel.MessReduction.Entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExtraSubmissionRequestRepo extends JpaRepository<ExtraSubmissionRequest, Long> {
    List<ExtraSubmissionRequest> findByStudentDetailsStudentId(Long studentId);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ExtraSubmissionRequest> findByStatus(RequestStatus status);
}
