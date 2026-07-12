package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.PushSubscriptionReqDTO;
import com.hostel.MessReduction.Entity.PushSubscription;
import com.hostel.MessReduction.Repo.PushSubscriptionRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/push")
public class PushSubscriptionController {
    private static final Logger log = LoggerFactory.getLogger(PushSubscriptionController.class);

    private final PushSubscriptionRepository pushSubscriptionRepository;

    public PushSubscriptionController(PushSubscriptionRepository pushSubscriptionRepository) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
    }

    @PostMapping("/subscribe")
    @Transactional
    public ResponseEntity<?> subscribe(
            @Valid @RequestBody PushSubscriptionReqDTO dto,
            Authentication authentication) {
        String username = authentication.getName();
        log.info("Received push subscription request for user: {}", username);

        // Enforce "One active subscription per user. Replace old subscription if user subscribes again."
        List<PushSubscription> oldSubscriptions = pushSubscriptionRepository.findByUsername(username);
        if (!oldSubscriptions.isEmpty()) {
            pushSubscriptionRepository.deleteAll(oldSubscriptions);
            log.info("Deleted {} old subscriptions for user: {}", oldSubscriptions.size(), username);
        }

        // Also check if the endpoint is already registered by another user, and delete it to prevent conflict
        pushSubscriptionRepository.findByEndpoint(dto.getEndpoint()).ifPresent(sub -> {
            pushSubscriptionRepository.delete(sub);
            log.info("Deleted subscription with matching endpoint registered by another user: {}", sub.getUsername());
        });

        // Save new subscription
        PushSubscription subscription = new PushSubscription();
        subscription.setUsername(username);
        subscription.setEndpoint(dto.getEndpoint());
        subscription.setP256dh(dto.getP256dh());
        subscription.setAuth(dto.getAuth());

        pushSubscriptionRepository.save(subscription);
        log.info("Successfully saved push subscription for user: {}", username);
        return ResponseEntity.ok(Map.of("message", "Subscribed successfully"));
    }

    @DeleteMapping("/unsubscribe")
    @Transactional
    public ResponseEntity<?> unsubscribe(
            @RequestParam(required = false) String endpoint,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        String username = authentication.getName();
        log.info("Received push unsubscribe request for user: {}", username);

        String targetEndpoint = endpoint;
        if (targetEndpoint == null && body != null) {
            targetEndpoint = body.get("endpoint");
        }

        if (targetEndpoint != null) {
            final String finalEndpoint = targetEndpoint;
            pushSubscriptionRepository.findByEndpoint(finalEndpoint).ifPresent(sub -> {
                if (sub.getUsername().equals(username)) {
                    pushSubscriptionRepository.delete(sub);
                    log.info("Removed push subscription for endpoint: {}", finalEndpoint);
                }
            });
        } else {
            List<PushSubscription> subs = pushSubscriptionRepository.findByUsername(username);
            pushSubscriptionRepository.deleteAll(subs);
            log.info("Removed all push subscriptions for user: {}", username);
        }

        return ResponseEntity.ok(Map.of("message", "Unsubscribed successfully"));
    }
}

