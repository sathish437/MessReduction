package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.ReductionFormHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReductionFormHistoryRepo extends JpaRepository<ReductionFormHistory, Long> {
    List<ReductionFormHistory> findByReductionFormFormIdOrderByEventTimestampAsc(Long formId);
    List<ReductionFormHistory> findByReductionFormFormIdAndIsActiveTrueOrderByEventTimestampAsc(Long formId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(h) FROM ReductionFormHistory h WHERE h.toStatus = :status AND h.eventTimestamp BETWEEN :start AND :end")
    Long countByToStatusAndEventTimestampBetween(@org.springframework.data.repository.query.Param("status") com.hostel.MessReduction.Entity.FormStatus status, @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);
}
