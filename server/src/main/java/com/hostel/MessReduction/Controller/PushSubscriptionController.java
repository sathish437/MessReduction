package com.hostel.MessReduction.Controller;

import com.hostel.MessReduction.DTO.ReqDTO.PushSubscriptionReqDTO;
import com.hostel.MessReduction.Entity.PushSubscription;
import com.hostel.MessReduction.Entity.SubscriptionDetail;
import com.hostel.MessReduction.Repo.PushSubscriptionRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

        // Also check if the endpoint is already registered by another user, and delete it to prevent conflict
        List<PushSubscription> otherSubs = pushSubscriptionRepository.findByEndpointLike(dto.getEndpoint());
        for (PushSubscription otherSub : otherSubs) {
            if (otherSub.getSubscriptions() != null) {
                boolean removed = otherSub.getSubscriptions().removeIf(sub -> dto.getEndpoint().equals(sub.getEndpoint()));
                if (removed) {
                    if (otherSub.getSubscriptions().isEmpty()) {
                        pushSubscriptionRepository.delete(otherSub);
                    } else {
                        pushSubscriptionRepository.save(otherSub);
                    }
                    log.info("Deleted conflicting endpoint registered by user: {}", otherSub.getUsername());
                }
            }
        }

        // Save new subscription
        PushSubscription subscription = pushSubscriptionRepository.findByUsername(username)
                .orElseGet(() -> {
                    PushSubscription newSub = new PushSubscription();
                    newSub.setUsername(username);
                    newSub.setSubscriptions(new ArrayList<>());
                    return newSub;
                });

        if (subscription.getSubscriptions() == null) {
            subscription.setSubscriptions(new ArrayList<>());
        }

        // Remove existing endpoint if already present under this user to avoid duplicates
        subscription.getSubscriptions().removeIf(sub -> dto.getEndpoint().equals(sub.getEndpoint()));

        SubscriptionDetail detail = new SubscriptionDetail(dto.getEndpoint(), dto.getP256dh(), dto.getAuth());
        subscription.getSubscriptions().add(detail);

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
            pushSubscriptionRepository.findByUsername(username).ifPresent(sub -> {
                if (sub.getSubscriptions() != null) {
                    boolean removed = sub.getSubscriptions().removeIf(detail -> finalEndpoint.equals(detail.getEndpoint()));
                    if (removed) {
                        if (sub.getSubscriptions().isEmpty()) {
                            pushSubscriptionRepository.delete(sub);
                        } else {
                            pushSubscriptionRepository.save(sub);
                        }
                        log.info("Removed push subscription for endpoint: {}", finalEndpoint);
                    }
                }
            });
        } else {
            pushSubscriptionRepository.deleteByUsername(username);
            log.info("Removed all push subscriptions for user: {}", username);
        }

        return ResponseEntity.ok(Map.of("message", "Unsubscribed successfully"));
    }
}
