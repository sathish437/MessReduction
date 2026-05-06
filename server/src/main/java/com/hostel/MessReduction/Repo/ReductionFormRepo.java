package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.ReductionForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReductionFormRepo extends JpaRepository<ReductionForm,Long> {
    boolean existsByStudentDetailsStudentIdAndCurrentStatusIn(Long id, List<FormStatus> statuses);
    List<ReductionForm> findByCurrentStatus(FormStatus status);
    List<ReductionForm> findByCurrentStatusAndYear(FormStatus status,Integer year);
    Long countByCurrentStatus(FormStatus status);
    Long countByCurrentStatusAndYear(FormStatus status,Integer year);
}
