package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.FcmTokenRequestDTO;
import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Entity.FcmToken;
import com.hostel.MessReduction.Repo.FcmTokenRepository;
import com.hostel.MessReduction.Service.NotificationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService notificationService;
    private final FcmTokenRepository fcmTokenRepository;

    public NotificationController(NotificationService notificationService,
                                  FcmTokenRepository fcmTokenRepository) {
        this.notificationService = notificationService;
        this.fcmTokenRepository = fcmTokenRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(Authentication authentication) {
        String username = authentication.getName();
        List<AppNotification> notifications = notificationService.getUserNotifications(username);
        long unreadCount = notificationService.getUnreadCount(username);
        
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications);
        response.put("unreadCount", unreadCount);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<String> markAsRead(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        notificationService.markAsRead(id, username);
        return ResponseEntity.ok("Notification marked as read");
    }

    @PatchMapping("/read-all")
    public ResponseEntity<String> markAllAsRead(Authentication authentication) {
        String username = authentication.getName();
        notificationService.markAllAsRead(username);
        return ResponseEntity.ok("All notifications marked as read");
    }

    /**
     * Register or update an FCM token for the authenticated user.
     * The authenticated user identity is strictly extracted from the security context.
     */
    @PostMapping("/fcm-token")
    @Transactional
    public ResponseEntity<?> registerFcmToken(
            @Valid @RequestBody FcmTokenRequestDTO dto,
            Authentication authentication) {
        String username = authentication.getName();
        String token = dto.getToken().trim();
        String platform = dto.getPlatform() != null ? dto.getPlatform().trim() : "web";

        Optional<FcmToken> existingOpt = fcmTokenRepository.findByToken(token);
        if (existingOpt.isPresent()) {
            FcmToken existing = existingOpt.get();
            existing.setUsername(username);
            existing.setPlatform(platform);
            existing.setActive(true);
            fcmTokenRepository.save(existing);
            logger.info("FCM token updated for user: {}", username);
        } else {
            FcmToken newToken = new FcmToken(username, token, platform);
            fcmTokenRepository.save(newToken);
            logger.info("FCM token registered for user: {}", username);
        }

        return ResponseEntity.ok(Map.of("message", "FCM token registered successfully"));
    }

    /**
     * Unregister / deactivate an FCM token for the authenticated user upon logout.
     */
    @DeleteMapping("/fcm-token")
    @Transactional
    public ResponseEntity<?> unregisterFcmToken(
            @RequestParam(required = false) String token,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String username = authentication.getName();
        String targetToken = token;
        if (targetToken == null && body != null) {
            targetToken = body.get("token");
        }

        if (targetToken != null && !targetToken.trim().isEmpty()) {
            fcmTokenRepository.deactivateUserToken(username, targetToken.trim());
            logger.info("FCM token deactivated for user: {}", username);
        } else {
            List<FcmToken> userTokens = fcmTokenRepository.findByUsername(username);
            for (FcmToken t : userTokens) {
                t.setActive(false);
            }
            fcmTokenRepository.saveAll(userTokens);
            logger.info("All FCM tokens deactivated for user: {}", username);
        }

        return ResponseEntity.ok(Map.of("message", "FCM token unregistered successfully"));
    }
}
