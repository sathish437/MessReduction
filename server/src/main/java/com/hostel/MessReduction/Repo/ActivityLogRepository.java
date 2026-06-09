package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByStaffNameAndIsActiveTrue(String staffName);
    List<ActivityLog> findByIsActiveTrueAndArrivalDateBefore(LocalDate date);
}
