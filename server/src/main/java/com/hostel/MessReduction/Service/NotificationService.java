package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Repo.AppNotificationRepository;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
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
    private final StaffUsersRepo staffUsersRepo;
    private final PushNotificationService pushNotificationService;
    private final BatchNotificationService batchNotificationService;
    private final ConcurrentHashMap<String, Long> notificationLocks = new ConcurrentHashMap<>();

    public NotificationService(AppNotificationRepository notificationRepo, 
                               StaffUsersRepo staffUsersRepo, 
                               PushNotificationService pushNotificationService,
                               BatchNotificationService batchNotificationService) {
        this.notificationRepo = notificationRepo;
        this.staffUsersRepo = staffUsersRepo;
        this.pushNotificationService = pushNotificationService;
        this.batchNotificationService = batchNotificationService;
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
            
            staffUsersRepo.findByUserName(recipientUsername).ifPresent(staff -> {
                notification.setRecipientRole(staff.getRole().name());
            });

            notificationRepo.save(notification);
            logger.info("[Notification Created] Successfully created for user: {} | Type: {} | Message: '{}'", recipientUsername, type, message);
            
            // Trigger browser push notification (delegated to batch or direct sending)
            String title = getPushTitle(recipientUsername, type, message);
            String redirectUrl = getPushRedirectUrl(recipientUsername, type, relatedFormId);
            batchNotificationService.enqueueOrSendPushNotification(recipientUsername, title, message, redirectUrl, type, relatedFormId);
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
            logger.info("[Notification Created] Aggregated notification successfully created for user: {} | Type: {} | Message: '{}'", recipientUsername, type, message);
            
            // Trigger browser push notification (delegated to batch or direct sending)
            String title = getPushTitle(recipientUsername, type, message);
            String redirectUrl = getPushRedirectUrl(recipientUsername, type, -1L);
            batchNotificationService.enqueueOrSendPushNotification(recipientUsername, title, message, redirectUrl, type, -1L);
        } catch (Exception e) {
            logger.error("Failed to create aggregated notification for user: {} | Exception: {}", recipientUsername, e.getMessage(), e);
        }
    }

    private String getPushTitle(String recipientUsername, String type, String message) {
        if ("REJECTED".equals(type) || (message != null && message.toLowerCase().contains("rejected"))) {
            return "Request Rejected";
        }
        if ("APPROVED".equals(type) || (message != null && message.toLowerCase().contains("approved"))) {
            return "Request Approved";
        }
        if (recipientUsername != null) {
            if (recipientUsername.startsWith("deputy")) {
                return "New Mess Reduction Request";
            }
            if ("warden".equalsIgnoreCase(recipientUsername) || recipientUsername.startsWith("warden")) {
                return "New Mess Reduction Request Pending";
            }
            if ("office".equalsIgnoreCase(recipientUsername)) {
                return "New Mess Reduction Request";
            }
        }
        return "Mess Reduction Update";
    }

    private String getPushRedirectUrl(String recipientUsername, String type, Long formId) {
        if (recipientUsername == null) {
            return "/";
        }
        if (recipientUsername.contains("@")) {
            return "/student-dashboard";
        }
        if ("warden".equalsIgnoreCase(recipientUsername) || recipientUsername.startsWith("warden")) {
            return "/warden";
        }
        if ("office".equalsIgnoreCase(recipientUsername)) {
            return "/office";
        }
        if (recipientUsername.startsWith("deputy")) {
            if (formId != null && formId > 0) {
                return "/deputy/request/" + formId;
            }
            return "/deputy";
        }
        return "/student-dashboard";
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
