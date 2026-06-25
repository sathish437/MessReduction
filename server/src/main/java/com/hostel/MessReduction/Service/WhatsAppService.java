package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.Entity.ReductionForm;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

/**
 * WhatsApp notification service using Meta WhatsApp Cloud API.
 *
 * Configuration required in application.properties:
 *   whatsapp.meta.token=YOUR_WHATSAPP_TOKEN
 *   whatsapp.meta.phone-number-id=YOUR_PHONE_NUMBER_ID
 *   whatsapp.meta.to-number=+91XXXXXXXXXX           (destination test number)
 *
 * All sends are @Async so they never block the main request flow.
 */
@Service
public class WhatsAppService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppService.class);

    @Value("${whatsapp.meta.token:}")
    private String whatsappToken;

    @Value("${whatsapp.meta.phone-number-id:}")
    private String phoneNumberId;

    @Value("${whatsapp.meta.to-number:}")
    private String toNumber;

    private final RestTemplate restTemplate;

    public WhatsAppService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Send a plain-text WhatsApp message asynchronously.
     * All errors are caught internally so this call never interrupts the main flow.
     */
    @Async
    public void sendWhatsAppNotification(String number, String message) {
        if (!isConfigured()) {
            logger.warn("[WhatsApp] Meta Cloud API credentials or numbers are not configured. Skipping notification.");
            return;
        }
        try {
            String url = "https://graph.facebook.com/v19.0/" + phoneNumberId + "/messages";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(whatsappToken);

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("to", number);
            body.put("type", "text");

            Map<String, String> textObj = new HashMap<>();
            textObj.put("body", message);
            body.put("text", textObj);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);

            logger.info("[WhatsApp] Notification sent successfully to {}.", number);
        } catch (Exception e) {
            // Non-blocking: log the error but do not rethrow
            logger.error("[WhatsApp] Failed to send notification: {}", e.getMessage());
        }
    }

    /**
     * Sends a grouped summary message for a list of pending forms.
     */
    @Async
    public void sendAggregatedWhatsAppNotification(List<ReductionForm> forms, String headerTitle) {
        if (forms == null || forms.isEmpty()) return;

        StringBuilder sb = new StringBuilder();
        sb.append("🍽️ *Hostel Mess Reduction*\n\n");
        sb.append("*").append(headerTitle).append("*\n");
        sb.append("Total Pending: ").append(forms.size()).append("\n\n");

        for (ReductionForm form : forms) {
            sb.append("• Form #").append(form.getFormId())
              .append(" - ").append(form.getStudentDetails().getName()).append("\n");
        }

        sb.append("\nPlease log in to review and process pending requests.");

        sendWhatsAppNotification(toNumber, sb.toString());
    }

    /**
     * Sends a WhatsApp notification when a form status changes (approve/reject).
     */
    @Async
    public void sendFormStatusNotification(ReductionForm form, String status) {
        String message = String.format(
            "🍽️ *Hostel Update*\n\nForm #%d\nStudent: %s\nReg No: %s\nStatus: *%s*\n\nPlease log in for more details.",
            form.getFormId(),
            form.getStudentDetails().getName(),
            form.getStudentDetails().getRegisterNo(),
            status
        );
        sendWhatsAppNotification(toNumber, message);
    }

    /**
     * Sends a WhatsApp notification specifically for auto-accept events.
     */
    @Async
    public void sendAutoAcceptNotification(ReductionForm form, String role) {
        String message = String.format(
            "🍽️ *Hostel Update*\n\nForm #%d has been *AUTO ACCEPTED* by system.\nStudent: %s\nTriggered by: %s Panel\n\nNo action required.",
            form.getFormId(),
            form.getStudentDetails().getName(),
            role
        );
        sendWhatsAppNotification(toNumber, message);
    }

    private boolean isConfigured() {
        return whatsappToken != null && !whatsappToken.isBlank()
                && phoneNumberId != null && !phoneNumberId.isBlank()
                && toNumber != null && !toNumber.isBlank();
    }
}
