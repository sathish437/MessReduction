package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.Entity.AppNotification;
import com.hostel.MessReduction.Service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
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
}
