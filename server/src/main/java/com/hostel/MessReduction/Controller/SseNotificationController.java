package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.CustomException.UnauthorizedUserException;
import com.hostel.MessReduction.Service.SseNotificationService;
import com.hostel.MessReduction.security.StaffUserDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications/sse")
@Slf4j
public class SseNotificationController {

    private final SseNotificationService sseNotificationService;

    public SseNotificationController(SseNotificationService sseNotificationService) {
        this.sseNotificationService = sseNotificationService;
    }

    /**
     * Subscribe to real-time Server-Sent Events for authenticated Deputy Wardens.
     * Supports Last-Event-ID header for automatic missed event replay upon reconnection.
     */
    @GetMapping(value = {"", "/subscribe"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasAnyRole('DeputyWarden', 'Warden')")
    public SseEmitter subscribe(
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedUserException("Authentication required for SSE connection");
        }

        String username = authentication.getName();
        Long userId = null;

        if (authentication.getPrincipal() instanceof StaffUserDetails userDetails) {
            if (userDetails.getStaffUsers() != null) {
                userId = userDetails.getStaffUsers().getUserId();
            }
        }

        log.info("SSE subscription request from Deputy Warden: {} (id: {}) with Last-Event-ID: {}",
                username, userId, lastEventId);

        return sseNotificationService.createConnection(userId, username, lastEventId);
    }
}
