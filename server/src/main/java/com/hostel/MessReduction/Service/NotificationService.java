package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Entity.Role;
import com.hostel.MessReduction.Entity.StaffUsers;
import com.hostel.MessReduction.Entity.ReductionForm;
import com.hostel.MessReduction.Entity.FormStatus;
import com.hostel.MessReduction.Repo.AppNotificationRepository;
import com.hostel.MessReduction.Repo.StaffUsersRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
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
    private final FirebaseNotificationService firebaseNotificationService;
    private final Executor pushNotificationExecutor;
    private final com.hostel.MessReduction.Repo.ReductionFormRepo reductionFormRepo;
    private final ConcurrentHashMap<String, Long> notificationLocks = new ConcurrentHashMap<>();

    public NotificationService(AppNotificationRepository notificationRepo,
                               StaffUsersRepo staffUsersRepo,
                               PushNotificationService pushNotificationService,
                               BatchNotificationService batchNotificationService,
                               FirebaseNotificationService firebaseNotificationService,
                               @org.springframework.beans.factory.annotation.Qualifier("pushNotificationExecutor") Executor pushNotificationExecutor,
                               com.hostel.MessReduction.Repo.ReductionFormRepo reductionFormRepo) {
        this.notificationRepo = notificationRepo;
        this.staffUsersRepo = staffUsersRepo;
        this.pushNotificationService = pushNotificationService;
        this.batchNotificationService = batchNotificationService;
        this.firebaseNotificationService = firebaseNotificationService;
        this.pushNotificationExecutor = pushNotificationExecutor;
        this.reductionFormRepo = reductionFormRepo;
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
            
            // Trigger browser push notification & FCM push after main DB transaction commits safely
            String title = getPushTitle(recipientUsername, type, message);
            String body = getPushBody(recipientUsername, type, message, relatedFormId);
            String redirectUrl = getPushRedirectUrl(recipientUsername, type, relatedFormId);
            triggerPushNotificationSafely(recipientUsername, title, body, redirectUrl, type, relatedFormId);
        } catch (Exception e) {
            logger.error("Failed to create notification for user: {} | Exception: {}", recipientUsername, e.getMessage(), e);
        }
    }

    public record BatchNotificationItem(String recipientUsername, String message, String type, Long relatedFormId, String recipientRole) {}

    public void createNotificationsBatch(List<BatchNotificationItem> items) {
        if (items == null || items.isEmpty()) return;
        List<AppNotification> toSave = new ArrayList<>();
        List<Runnable> pushTasks = new ArrayList<>();
        long currentTime = System.currentTimeMillis();

        for (BatchNotificationItem item : items) {
            if (item == null) continue;
            String recipientUsername = item.recipientUsername();
            String message = item.message();
            String type = item.type();
            Long relatedFormId = item.relatedFormId();
            if (recipientUsername == null) continue;

            String lockKey = recipientUsername + ":" + type + ":" + relatedFormId;
            if (notificationLocks.containsKey(lockKey)) {
                long lastSent = notificationLocks.get(lockKey);
                if (currentTime - lastSent < 30000) {
                    continue;
                }
            }
            notificationLocks.put(lockKey, currentTime);

            AppNotification notification = new AppNotification();
            notification.setRecipientUsername(recipientUsername);
            notification.setMessage(message);
            notification.setType(type);
            notification.setRelatedFormId(relatedFormId);

            if (item.recipientRole() != null) {
                notification.setRecipientRole(item.recipientRole());
            } else if (recipientUsername.startsWith("deputy") || recipientUsername.startsWith("warden") || "office".equalsIgnoreCase(recipientUsername)) {
                staffUsersRepo.findByUserName(recipientUsername).ifPresent(staff -> {
                    notification.setRecipientRole(staff.getRole().name());
                });
            } else {
                notification.setRecipientRole("STUDENT");
            }
            toSave.add(notification);

            String title = getPushTitle(recipientUsername, type, message);
            String body = getPushBody(recipientUsername, type, message, relatedFormId);
            String redirectUrl = getPushRedirectUrl(recipientUsername, type, relatedFormId);
            pushTasks.add(() -> {
                try {
                    batchNotificationService.enqueueOrSendPushNotification(recipientUsername, title, body, redirectUrl, type, relatedFormId);
                } catch (Exception e) {
                    logger.error("Failed to send push notification for user: {}", recipientUsername, e);
                }
                try {
                    Map<String, String> fcmData = new HashMap<>();
                    fcmData.put("type", type != null ? type : "MESS_REDUCTION");
                    fcmData.put("formId", relatedFormId != null ? String.valueOf(relatedFormId) : "-1");
                    fcmData.put("url", redirectUrl != null ? redirectUrl : "/");
                    fcmData.put("title", title != null ? title : "Mess Reduction Update");
                    fcmData.put("message", body != null ? body : "");
                    firebaseNotificationService.sendNotificationToUser(recipientUsername, title, body, fcmData);
                } catch (Exception e) {
                    logger.error("Failed to send batch FCM notification for user: {}", recipientUsername, e);
                }
            });
        }

        if (!toSave.isEmpty()) {
            notificationRepo.saveAll(toSave);
        }

        if (!pushTasks.isEmpty()) {
            Runnable asyncPushRunner = () -> {
                CompletableFuture.runAsync(() -> {
                    for (Runnable task : pushTasks) {
                        try {
                            task.run();
                        } catch (Exception e) {
                            logger.error("Error executing background push task", e);
                        }
                    }
                }, pushNotificationExecutor);
            };

            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        asyncPushRunner.run();
                    }
                });
            } else {
                asyncPushRunner.run();
            }
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
            
            // Trigger browser push notification & FCM push after main DB transaction commits safely
            String title = getPushTitle(recipientUsername, type, message);
            String redirectUrl = getPushRedirectUrl(recipientUsername, type, -1L);
            triggerPushNotificationSafely(recipientUsername, title, message, redirectUrl, type, -1L);
        } catch (Exception e) {
            logger.error("Failed to create aggregated notification for user: {} | Exception: {}", recipientUsername, e.getMessage(), e);
        }
    }

    private void triggerPushNotificationSafely(String recipientUsername, String title, String message, String redirectUrl, String type, Long relatedFormId) {
        Runnable sendPushTask = () -> {
            try {
                batchNotificationService.enqueueOrSendPushNotification(recipientUsername, title, message, redirectUrl, type, relatedFormId);
            } catch (Exception e) {
                logger.error("Failed to send push notification for user: {} | Exception: {}", recipientUsername, e.getMessage(), e);
            }

            try {
                Map<String, String> fcmData = new HashMap<>();
                fcmData.put("type", type != null ? type : "MESS_REDUCTION");
                fcmData.put("formId", relatedFormId != null ? String.valueOf(relatedFormId) : "-1");
                fcmData.put("url", redirectUrl != null ? redirectUrl : "/");
                fcmData.put("title", title != null ? title : "Mess Reduction Update");
                fcmData.put("message", message != null ? message : "");
                firebaseNotificationService.sendNotificationToUser(recipientUsername, title, message, fcmData);
            } catch (Exception e) {
                logger.error("Failed to send FCM notification for user: {} | Exception: {}", recipientUsername, e.getMessage(), e);
            }
        };

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    CompletableFuture.runAsync(sendPushTask, pushNotificationExecutor);
                }
            });
        } else {
            CompletableFuture.runAsync(sendPushTask, pushNotificationExecutor);
        }
    }

    private String getPushTitle(String recipientUsername, String type, String message) {
        if ("REMINDER".equals(type) || "BATCH_REMINDER".equals(type) || (message != null && message.toLowerCase().contains("reminder"))) {
            return "Mess Reduction Reminder";
        }
        if (message != null && message.toLowerCase().contains("resubmitted")) {
            return "Mess Reduction Request Resubmitted";
        }
        if ("REJECTED".equals(type) || (message != null && message.toLowerCase().contains("rejected"))) {
            return "Mess Reduction Request Rejected";
        }
        if ("APPROVED".equals(type) || (message != null && message.toLowerCase().contains("approved"))) {
            return "Request Approved";
        }
        if (recipientUsername != null) {
            if (recipientUsername.startsWith("deputy")) {
                return "New Mess Reduction Request";
            }
            if ("warden".equalsIgnoreCase(recipientUsername) || recipientUsername.startsWith("warden") || "office".equalsIgnoreCase(recipientUsername)) {
                return "Mess Reduction Request Pending";
            }
        }
        return "Mess Reduction Update";
    }

    private String getPushBody(String recipientUsername, String type, String message, Long relatedFormId) {
        ReductionForm form = null;
        if (relatedFormId != null && relatedFormId > 0) {
            try {
                form = reductionFormRepo.findById(relatedFormId).orElse(null);
            } catch (Exception e) {
                logger.error("Error fetching form for push body customization", e);
            }
        }

        boolean isResubmitted = form != null && form.getResubmissionCount() > 0 && 
            (message != null && (message.toLowerCase().contains("resubmitted") || message.toLowerCase().contains("rejection")));

        if (isResubmitted) {
            return "A previously rejected mess reduction request has been edited and resubmitted for your review.";
        }

        if ("REJECTED".equals(type) || (message != null && message.toLowerCase().contains("rejected"))) {
            String baseMsg = "Your mess reduction request has been rejected. Please check the rejection reason.";
            if (form != null && form.getRejectReason() != null && !form.getRejectReason().trim().isEmpty()) {
                return baseMsg + " Reason: " + form.getRejectReason().trim();
            }
            return baseMsg;
        }

        if (recipientUsername != null) {
            if (recipientUsername.startsWith("deputy")) {
                String studentName = (form != null && form.getStudentDetails() != null) ? form.getStudentDetails().getName() : null;
                if (studentName != null && !studentName.trim().isEmpty()) {
                    return "New mess reduction request from " + studentName + ".";
                }
                return "A new mess reduction request requires your approval.";
            }
            if ("warden".equalsIgnoreCase(recipientUsername) || recipientUsername.startsWith("warden")) {
                return "A mess reduction request is waiting for your approval.";
            }
            if ("office".equalsIgnoreCase(recipientUsername)) {
                return "A mess reduction request is waiting for Office approval.";
            }
        }

        return message != null ? message : "You have a new update in the Mess Reduction portal.";
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
            AppNotification notification = notificationRepo.findById(id).orElseThrow(() -> new com.hostel.MessReduction.CustomException.BadRequestException("Notification not found"));
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
