package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Repo.AppNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationQueueService {
    
    private final AppNotificationRepository notificationRepo;

    public NotificationQueueService(AppNotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    public List<AppNotification> getPendingNotifications() {
        return notificationRepo.findByWhatsappStatusOrderByCreatedAtAsc("PENDING");
    }

    @Transactional
    public void markAsSent(List<Long> notificationIds) {
        if (notificationIds != null && !notificationIds.isEmpty()) {
            notificationRepo.updateWhatsappStatusAndSentTimeByIdIn("SENT", LocalDateTime.now(), notificationIds);
        }
    }

    @Transactional
    public void incrementRetryCount(List<Long> notificationIds) {
        if (notificationIds != null && !notificationIds.isEmpty()) {
            notificationRepo.incrementRetryCountByIdIn(notificationIds);
        }
    }

    public LocalDateTime getLastSentTimestamp(String username) {
        AppNotification lastSent = notificationRepo.findFirstByRecipientUsernameAndWhatsappStatusOrderBySentTimeDesc(username, "SENT");
        return lastSent != null ? lastSent.getSentTime() : null;
    }
}
