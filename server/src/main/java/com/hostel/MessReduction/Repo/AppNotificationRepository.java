package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    List<AppNotification> findByWhatsappStatusOrderByCreatedAtAsc(String whatsappStatus);
    AppNotification findFirstByRecipientUsernameAndWhatsappStatusOrderBySentTimeDesc(String recipientUsername, String whatsappStatus);

    @Modifying
    @Query("UPDATE AppNotification a SET a.whatsappStatus = :status, a.sentTime = :sentTime WHERE a.id IN :ids")
    void updateWhatsappStatusAndSentTimeByIdIn(@Param("status") String status, @Param("sentTime") LocalDateTime sentTime, @Param("ids") List<Long> ids);

    @Modifying
    @Query("UPDATE AppNotification a SET a.retryCount = a.retryCount + 1 WHERE a.id IN :ids")
    void incrementRetryCountByIdIn(@Param("ids") List<Long> ids);
}
