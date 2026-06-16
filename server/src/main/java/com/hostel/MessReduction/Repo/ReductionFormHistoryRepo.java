package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.ReductionFormHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReductionFormHistoryRepo extends JpaRepository<ReductionFormHistory, Long> {
    List<ReductionFormHistory> findByReductionFormFormIdOrderByEventTimestampAsc(Long formId);
    List<ReductionFormHistory> findByReductionFormFormIdAndIsActiveTrueOrderByEventTimestampAsc(Long formId);
}
