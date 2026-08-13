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

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("DELETE FROM ExtraSubmissionRequest e WHERE e.studentDetails.id IN :studentIds")
    int deleteExtraSubmissionsByStudentIdsIn(@org.springframework.data.repository.query.Param("studentIds") List<Long> studentIds);
}
