package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.ReductionForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReductionFormRepo extends JpaRepository<ReductionForm,Long> {
    boolean existsByStudentDetailsStudentIdAndCurrentStatusIn(Long id, List<FormStatus> statuses);
    List<ReductionForm> findByCurrentStatus(FormStatus status);
    List<ReductionForm> findByCurrentStatusAndYear(FormStatus status,Integer year);
    List<ReductionForm> findByCurrentStatusAndAssignedDeputyWarden(FormStatus status, String assignedDeputyWarden);
    Long countByCurrentStatus(FormStatus status);
    Long countByCurrentStatusAndAssignedDeputyWarden(FormStatus status, String assignedDeputyWarden);
    Long countByCurrentStatusAndYear(FormStatus status,Integer year);
    List<ReductionForm> findByStudentDetailsStudentId(Long studentId);
    Optional<ReductionForm> findByFormIdAndStudentDetailsStudentId(Long formId, Long studentId);
    List<ReductionForm> findByCurrentStatusIn(List<FormStatus> statuses);
    List<ReductionForm> findByCurrentStatusInAndIsActiveTrue(List<FormStatus> statuses);
    
    @Query("SELECT DISTINCT r FROM ReductionForm r JOIN FETCH r.history WHERE r.currentStatus IN :statuses AND r.isActive = true")
    List<ReductionForm> findPendingFormsWithHistory(@Param("statuses") List<FormStatus> statuses);
    
    // Testing Mode Methods
    List<ReductionForm> findByCurrentStatusInAndSubmittedAtAfter(List<FormStatus> statuses, java.time.LocalDateTime time);

    // New methods for filtering by gender and year
    List<ReductionForm> findByCurrentStatusAndStudentDetailsGender(FormStatus status, Gender gender);
    List<ReductionForm> findByCurrentStatusAndYearAndStudentDetailsGender(FormStatus status, Integer year, Gender gender);

    // Method to check for active approved requests by student
    List<ReductionForm> findByStudentDetailsStudentIdAndCurrentStatusAndArrivalDateAfter(Long studentId, FormStatus status, java.time.LocalDate currentDate);

    // isActive filtering methods
    List<ReductionForm> findByCurrentStatusAndIsActiveTrue(FormStatus status);
    List<ReductionForm> findByCurrentStatusAndYearAndIsActiveTrue(FormStatus status, Integer year);
    List<ReductionForm> findByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus status, String assignedDeputyWarden);
    Long countByCurrentStatusAndIsActiveTrue(FormStatus status);
    Long countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus status, String assignedDeputyWarden);
    Long countByCurrentStatusAndYearAndIsActiveTrue(FormStatus status, Integer year);
    List<ReductionForm> findByStudentDetailsStudentIdAndIsActiveTrue(Long studentId);
    Optional<ReductionForm> findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(Long formId, Long studentId);
    List<ReductionForm> findByCurrentStatusAndStudentDetailsGenderAndIsActiveTrue(FormStatus status, Gender gender);
    List<ReductionForm> findByCurrentStatusAndYearAndStudentDetailsGenderAndIsActiveTrue(FormStatus status, Integer year, Gender gender);
    List<ReductionForm> findByStudentDetailsStudentIdAndCurrentStatusAndArrivalDateAfterAndIsActiveTrue(Long studentId, FormStatus status, java.time.LocalDate currentDate);
    List<ReductionForm> findByIsActiveTrueAndArrivalDateBefore(java.time.LocalDate date);
    List<ReductionForm> findByIsActiveTrue();
    List<ReductionForm> findByCurrentStatusAndLeaveDateBetweenOrderByLeaveDateAsc(FormStatus status, java.time.LocalDate startDate, java.time.LocalDate endDate);
    List<ReductionForm> findByArrivalDateBefore(java.time.LocalDate date);
}
