package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.ReductionFormHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReductionFormHistoryRepo extends JpaRepository<ReductionFormHistory, Long> {
    List<ReductionFormHistory> findByReductionFormFormIdOrderByEventTimestampAsc(Long formId);
    List<ReductionFormHistory> findByReductionFormFormIdAndIsActiveTrueOrderByEventTimestampAsc(Long formId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @org.springframework.data.jpa.repository.Query("DELETE FROM ReductionFormHistory h WHERE h.reductionForm.id IN (SELECT r.id FROM ReductionForm r WHERE r.studentDetails.id IN :studentIds)")
    int deleteHistoriesByStudentIdsIn(@org.springframework.data.repository.query.Param("studentIds") List<Long> studentIds);
}
