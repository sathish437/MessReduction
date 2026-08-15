package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.hostel.MessReduction.Entity.Role;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long>, JpaSpecificationExecutor<ActivityLog> {
    List<ActivityLog> findByStaffNameAndIsActiveTrue(String staffName);
    List<ActivityLog> findByIsActiveTrueAndArrivalDateBefore(LocalDate date);
    Page<ActivityLog> findByStaffRoleAndActionAndIsActiveTrueOrderByTimestampDesc(Role staffRole, String action, Pageable pageable);

    @Query("SELECT a FROM ActivityLog a WHERE a.staffRole = com.hostel.MessReduction.Entity.Role.DeputyWarden AND a.action = :action AND a.isActive = true AND (a.staffName = :username OR a.formId IN (SELECT f.formId FROM ReductionForm f WHERE f.assignedDeputyWarden = :username)) ORDER BY a.timestamp DESC")
    Page<ActivityLog> findDeputyWardenLogs(@Param("username") String username, @Param("action") String action, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM ActivityLog a WHERE a.formId = :formId")
    void deleteByFormId(@Param("formId") Long formId);
}
