package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.QueuedNotification;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QueuedNotificationRepository extends JpaRepository<QueuedNotification, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM QueuedNotification q WHERE q.processed = false ORDER BY q.id ASC")
    List<QueuedNotification> findUnprocessedForUpdate();
}
