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

    @Query("SELECT r FROM ReductionForm r WHERE r.currentStatus IN :statuses AND r.isActive = true ORDER BY r.formId ASC")
    List<ReductionForm> findPendingFormsForUpdate(@Param("statuses") List<FormStatus> statuses);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE ReductionForm r SET r.isActive = false WHERE r.isActive = true AND (r.arrivalDate < :currentDate OR (r.arrivalDate = :currentDate AND r.arrivalTime <= :currentTime))")
    int deactivateExpiredForms(@Param("currentDate") java.time.LocalDate currentDate, @Param("currentTime") java.time.LocalTime currentTime);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE ReductionFormHistory h SET h.isActive = false WHERE h.isActive = true AND h.reductionForm.id IN (SELECT r.id FROM ReductionForm r WHERE r.isActive = false)")
    int deactivateExpiredFormHistories();
    
    // Testing Mode Methods
    List<ReductionForm> findByCurrentStatusInAndSubmittedAtAfter(List<FormStatus> statuses, java.time.LocalDateTime time);

    // New methods for filtering by gender and year
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndStudentDetailsGender(FormStatus status, Gender gender);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndYearAndStudentDetailsGender(FormStatus status, Integer year, Gender gender);

    // Method to check for active approved requests by student
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
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
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByCurrentStatusAndLeaveDateBetweenOrderByLeaveDateAsc(FormStatus status, java.time.LocalDate startDate, java.time.LocalDate endDate);
    List<ReductionForm> findByArrivalDateBefore(java.time.LocalDate date);

    Long countBySubmittedAtBetween(java.time.LocalDateTime startOfDay, java.time.LocalDateTime endOfDay);

    @org.springframework.data.jpa.repository.Query("SELECT r.studentDetails.department, COUNT(r) FROM ReductionForm r GROUP BY r.studentDetails.department")
    List<Object[]> countRequestsByDepartment();

    // High-performance single-query group by counts for dashboard
    @Query("SELECT r.currentStatus, COUNT(r) FROM ReductionForm r WHERE r.isActive = true GROUP BY r.currentStatus")
    List<Object[]> countGroupByStatus();

    @Query("SELECT r.currentStatus, COUNT(r) FROM ReductionForm r WHERE r.isActive = true AND r.year = :year GROUP BY r.currentStatus")
    List<Object[]> countGroupByStatusAndYear(@Param("year") Integer year);

    @Query("SELECT r.currentStatus, COUNT(r) FROM ReductionForm r WHERE r.isActive = true AND r.assignedDeputyWarden = :deputy GROUP BY r.currentStatus")
    List<Object[]> countGroupByStatusAndDeputy(@Param("deputy") String deputy);

    // Eager bulk fetch for form processing (Zero N+1)
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"studentDetails"})
    List<ReductionForm> findByFormIdIn(List<Long> formIds);

    // Database-level conditional BULK UPDATE / REJECT methods
    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReductionForm r SET r.currentStatus = :newStatus WHERE r.formId IN :formIds AND r.currentStatus = :expectedStatus AND r.assignedDeputyWarden = :deputyWarden AND r.isActive = true")
    int bulkUpdateDeputyWardenStatus(@Param("formIds") List<Long> formIds, @Param("expectedStatus") FormStatus expectedStatus, @Param("newStatus") FormStatus newStatus, @Param("deputyWarden") String deputyWarden);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReductionForm r SET r.currentStatus = :newStatus, r.rejectReason = :rejectReason WHERE r.formId IN :formIds AND r.currentStatus = :expectedStatus AND r.assignedDeputyWarden = :deputyWarden AND r.isActive = true")
    int bulkRejectDeputyWardenStatus(@Param("formIds") List<Long> formIds, @Param("expectedStatus") FormStatus expectedStatus, @Param("newStatus") FormStatus newStatus, @Param("rejectReason") String rejectReason, @Param("deputyWarden") String deputyWarden);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReductionForm r SET r.currentStatus = :newStatus WHERE r.formId IN :formIds AND r.currentStatus = :expectedStatus AND r.year = :year AND r.isActive = true")
    int bulkUpdateWardenStatusWithYear(@Param("formIds") List<Long> formIds, @Param("expectedStatus") FormStatus expectedStatus, @Param("newStatus") FormStatus newStatus, @Param("year") Integer year);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReductionForm r SET r.currentStatus = :newStatus, r.rejectReason = :rejectReason WHERE r.formId IN :formIds AND r.currentStatus = :expectedStatus AND r.year = :year AND r.isActive = true")
    int bulkRejectWardenStatusWithYear(@Param("formIds") List<Long> formIds, @Param("expectedStatus") FormStatus expectedStatus, @Param("newStatus") FormStatus newStatus, @Param("rejectReason") String rejectReason, @Param("year") Integer year);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReductionForm r SET r.currentStatus = :newStatus WHERE r.formId IN :formIds AND r.currentStatus = :expectedStatus AND r.isActive = true")
    int bulkUpdateWardenStatusAllYears(@Param("formIds") List<Long> formIds, @Param("expectedStatus") FormStatus expectedStatus, @Param("newStatus") FormStatus newStatus);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReductionForm r SET r.currentStatus = :newStatus, r.rejectReason = :rejectReason WHERE r.formId IN :formIds AND r.currentStatus = :expectedStatus AND r.isActive = true")
    int bulkRejectWardenStatusAllYears(@Param("formIds") List<Long> formIds, @Param("expectedStatus") FormStatus expectedStatus, @Param("newStatus") FormStatus newStatus, @Param("rejectReason") String rejectReason);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReductionForm r SET r.currentStatus = :newStatus WHERE r.formId IN :formIds AND r.currentStatus = :expectedStatus AND r.isActive = true")
    int bulkUpdateOfficeStatus(@Param("formIds") List<Long> formIds, @Param("expectedStatus") FormStatus expectedStatus, @Param("newStatus") FormStatus newStatus);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ReductionForm r SET r.currentStatus = :newStatus, r.rejectReason = :rejectReason WHERE r.formId IN :formIds AND r.currentStatus = :expectedStatus AND r.isActive = true")
    int bulkRejectOfficeStatus(@Param("formIds") List<Long> formIds, @Param("expectedStatus") FormStatus expectedStatus, @Param("newStatus") FormStatus newStatus, @Param("rejectReason") String rejectReason);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ReductionForm r WHERE r.studentDetails.id IN :studentIds")
    int deleteFormsByStudentIdsIn(@Param("studentIds") List<Long> studentIds);
}
