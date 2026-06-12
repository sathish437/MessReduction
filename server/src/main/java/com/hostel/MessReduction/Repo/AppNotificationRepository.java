package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {
    List<AppNotification> findByRecipientUsernameOrderByCreatedAtDesc(String recipientUsername);
    long countByRecipientUsernameAndIsReadFalse(String recipientUsername);
    
    // Testing Mode Methods
    AppNotification findFirstByOrderByIdDesc();
    List<AppNotification> findByRecipientUsernameAndIdGreaterThanOrderByIdDesc(String recipientUsername, Long id);
    long countByRecipientUsernameAndIsReadFalseAndIdGreaterThan(String recipientUsername, Long id);
}
