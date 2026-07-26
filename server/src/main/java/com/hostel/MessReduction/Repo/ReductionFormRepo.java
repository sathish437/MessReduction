package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Entity.Gender;
import com.hostel.MessReduction.Entity.ReductionForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReductionFormRepo extends JpaRepository<ReductionForm,Long>, JpaSpecificationExecutor<ReductionForm> {
    boolean existsByStudentDetailsStudentIdAndCurrentStatusIn(Long id, List<FormStatus> statuses);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatus(FormStatus status);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndYear(FormStatus status,Integer year);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndAssignedDeputyWarden(FormStatus status, String assignedDeputyWarden);
    Long countByCurrentStatus(FormStatus status);
    Long countByCurrentStatusAndAssignedDeputyWarden(FormStatus status, String assignedDeputyWarden);
    Long countByCurrentStatusAndYear(FormStatus status,Integer year);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByStudentDetailsStudentId(Long studentId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    Optional<ReductionForm> findByFormIdAndStudentDetailsStudentId(Long formId, Long studentId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusIn(List<FormStatus> statuses);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusInAndIsActiveTrue(List<FormStatus> statuses);
    
    @Query("SELECT DISTINCT r FROM ReductionForm r LEFT JOIN FETCH r.history WHERE r.currentStatus IN :statuses AND r.isActive = true")
    List<ReductionForm> findPendingFormsWithHistory(@Param("statuses") List<FormStatus> statuses);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ReductionForm r WHERE r.currentStatus IN :statuses AND r.isActive = true ORDER BY r.formId ASC")
    List<ReductionForm> findPendingFormsForUpdate(@Param("statuses") List<FormStatus> statuses);
    
    // Testing Mode Methods
    List<ReductionForm> findByCurrentStatusInAndSubmittedAtAfter(List<FormStatus> statuses, java.time.LocalDateTime time);

    // New methods for filtering by gender and year
    List<ReductionForm> findByCurrentStatusAndStudentDetailsGender(FormStatus status, Gender gender);
    List<ReductionForm> findByCurrentStatusAndYearAndStudentDetailsGender(FormStatus status, Integer year, Gender gender);

    // Method to check for active approved requests by student
    List<ReductionForm> findByStudentDetailsStudentIdAndCurrentStatusAndArrivalDateAfter(Long studentId, FormStatus status, java.time.LocalDate currentDate);

    // isActive filtering methods
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndIsActiveTrue(FormStatus status);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndYearAndIsActiveTrue(FormStatus status, Integer year);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus status, String assignedDeputyWarden);
    Long countByCurrentStatusAndIsActiveTrue(FormStatus status);
    Long countByCurrentStatusAndAssignedDeputyWardenAndIsActiveTrue(FormStatus status, String assignedDeputyWarden);
    Long countByAssignedDeputyWardenAndIsActiveTrue(String assignedDeputyWarden);
    Long countByCurrentStatusAndYearAndIsActiveTrue(FormStatus status, Integer year);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByStudentDetailsStudentIdAndIsActiveTrue(Long studentId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    Optional<ReductionForm> findByFormIdAndStudentDetailsStudentIdAndIsActiveTrue(Long formId, Long studentId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndStudentDetailsGenderAndIsActiveTrue(FormStatus status, Gender gender);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndYearAndStudentDetailsGenderAndIsActiveTrue(FormStatus status, Integer year, Gender gender);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByStudentDetailsStudentIdAndCurrentStatusAndArrivalDateAfterAndIsActiveTrue(Long studentId, FormStatus status, java.time.LocalDate currentDate);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByIsActiveTrueAndArrivalDateBefore(java.time.LocalDate date);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByIsActiveTrue();
    List<ReductionForm> findByCurrentStatusAndLeaveDateBetweenOrderByLeaveDateAsc(FormStatus status, java.time.LocalDate startDate, java.time.LocalDate endDate);
    List<ReductionForm> findByArrivalDateBefore(java.time.LocalDate date);

    Long countBySubmittedAtBetween(java.time.LocalDateTime startOfDay, java.time.LocalDateTime endOfDay);

    @org.springframework.data.jpa.repository.Query("SELECT r.studentDetails.department.departmentCode, COUNT(r) FROM ReductionForm r GROUP BY r.studentDetails.department.departmentCode")
    List<Object[]> countRequestsByDepartment();
}
