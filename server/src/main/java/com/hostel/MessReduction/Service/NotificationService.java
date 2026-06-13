package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Repo.AppNotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    
    // Testing Mode configuration
    private static final boolean TESTING_MODE = true;
    private Long appStartId = 0L;
    
    private final AppNotificationRepository notificationRepo;
    private final ConcurrentHashMap<String, Long> notificationLocks = new ConcurrentHashMap<>();

    public NotificationService(AppNotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        if (TESTING_MODE) {
            AppNotification latest = notificationRepo.findFirstByOrderByIdDesc();
            appStartId = latest != null ? latest.getId() : 0L;
            logger.info("Notification Testing Mode Initialized. Ignoring notifications with ID <= {}", appStartId);
        }
    }

    public void createNotification(String recipientUsername, String message, String type, Long relatedFormId) {
        String lockKey = recipientUsername + ":" + type + ":" + relatedFormId;
        long currentTime = System.currentTimeMillis();
        
        // 30 seconds cooldown to prevent rapid duplicate notifications
        if (notificationLocks.containsKey(lockKey)) {
            long lastSent = notificationLocks.get(lockKey);
            if (currentTime - lastSent < 30000) {
                logger.warn("Duplicate notification blocked for user: {} | Type: {} | FormId: {}", recipientUsername, type, relatedFormId);
                return;
            }
        }
        
        notificationLocks.put(lockKey, currentTime);

        try {
            AppNotification notification = new AppNotification();
            notification.setRecipientUsername(recipientUsername);
            notification.setMessage(message);
            notification.setType(type);
            notification.setRelatedFormId(relatedFormId);
            notificationRepo.save(notification);
            logger.info("Notification successfully created for user: {} | Type: {} | Message: '{}'", recipientUsername, type, message);
        } catch (Exception e) {
            logger.error("Failed to create notification for user: {} | Exception: {}", recipientUsername, e.getMessage(), e);
        }
    }

    public void createAggregatedNotification(String recipientUsername, String message, String type) {
        String lockKey = recipientUsername + ":" + type + ":AGGREGATED";
        long currentTime = System.currentTimeMillis();
        
        // 30 seconds cooldown to prevent rapid duplicate notifications
        if (notificationLocks.containsKey(lockKey)) {
            long lastSent = notificationLocks.get(lockKey);
            if (currentTime - lastSent < 30000) {
                logger.warn("Duplicate aggregated notification blocked for user: {} | Type: {}", recipientUsername, type);
                return;
            }
        }
        
        notificationLocks.put(lockKey, currentTime);

        try {
            AppNotification notification = new AppNotification();
            notification.setRecipientUsername(recipientUsername);
            notification.setMessage(message);
            notification.setType(type);
            notification.setRelatedFormId(-1L); // Use -1 for aggregated notifications
            notificationRepo.save(notification);
            logger.info("Aggregated Notification successfully created for user: {} | Type: {} | Message: '{}'", recipientUsername, type, message);
        } catch (Exception e) {
            logger.error("Failed to create aggregated notification for user: {} | Exception: {}", recipientUsername, e.getMessage(), e);
        }
    }

    public List<AppNotification> getUserNotifications(String username) {
        if (TESTING_MODE) {
            return notificationRepo.findByRecipientUsernameAndIdGreaterThanOrderByIdDesc(username, appStartId);
        }
        return notificationRepo.findByRecipientUsernameOrderByCreatedAtDesc(username);
    }

    public long getUnreadCount(String username) {
        if (TESTING_MODE) {
            return notificationRepo.countByRecipientUsernameAndIsReadFalseAndIdGreaterThan(username, appStartId);
        }
        return notificationRepo.countByRecipientUsernameAndIsReadFalse(username);
    }

    public void markAsRead(Long id, String username) {
        try {
            AppNotification notification = notificationRepo.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
            if (notification.getRecipientUsername().equals(username)) {
                notification.setRead(true);
                notificationRepo.save(notification);
                logger.info("Notification {} marked as read for user: {}", id, username);
            } else {
                logger.warn("User {} attempted to mark notification {} as read, but it belongs to another user.", username, id);
            }
        } catch (Exception e) {
            logger.error("Error marking notification {} as read for user {}: {}", id, username, e.getMessage());
            throw e;
        }
    }

    public void markAllAsRead(String username) {
        try {
            List<AppNotification> notifications;
            if (TESTING_MODE) {
                notifications = notificationRepo.findByRecipientUsernameAndIdGreaterThanOrderByIdDesc(username, appStartId);
            } else {
                notifications = notificationRepo.findByRecipientUsernameOrderByCreatedAtDesc(username);
            }
            int updatedCount = 0;
            for (AppNotification notification : notifications) {
                if (!notification.isRead()) {
                    notification.setRead(true);
                    updatedCount++;
                }
            }
            if (updatedCount > 0) {
                notificationRepo.saveAll(notifications);
                logger.info("Marked {} notifications as read for user: {}", updatedCount, username);
            }
        } catch (Exception e) {
            logger.error("Error marking all notifications as read for user {}: {}", username, e.getMessage());
            throw e;
        }
    }
}
