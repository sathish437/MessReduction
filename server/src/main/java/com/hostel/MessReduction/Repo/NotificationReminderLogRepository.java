package com.hostel.MessReduction.Repo;

import com.hostel.MessReduction.Entity.NotificationReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationReminderLogRepository extends JpaRepository<NotificationReminderLog, Long> {
    Optional<NotificationReminderLog> findByRecipientUsernameAndFormId(String recipientUsername, Long formId);
    java.util.List<NotificationReminderLog> findByFormIdIn(java.util.List<Long> formIds);
    java.util.List<NotificationReminderLog> findByRecipientUsernameAndFormIdIn(String recipientUsername, java.util.List<Long> formIds);
}
