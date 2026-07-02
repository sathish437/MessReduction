package com.hostel.MessReduction.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppService {

    private static final Logger logger = LoggerFactory.getLogger(WhatsAppService.class);

    @Value("${whatsapp.meta.token:}")
    private String whatsappToken;

    @Value("${whatsapp.meta.phone-number-id:}")
    private String phoneNumberId;

    @Value("${whatsapp.meta.api-version:v25.0}")
    private String apiVersion;

    private final RestTemplate restTemplate;

    public WhatsAppService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Sends a normal WhatsApp text message asynchronously.
     * Retries up to 3 times on connection errors or 5xx server errors.
     * Does NOT retry on 4xx client errors (e.g. invalid number or unauthorized).
     */
    @Async
    @Retryable(
        retryFor = { HttpServerErrorException.class, ResourceAccessException.class },
        noRetryFor = { HttpClientErrorException.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public void sendTextMessage(String phoneNumber, String message) {
        if (!isConfigured()) {
            logger.warn("[WhatsApp] Meta Cloud API credentials are not configured. Skipping notification.");
            return;
        }

        if (phoneNumber == null || phoneNumber.isBlank()) {
            logger.warn("[WhatsApp] Skipping notification. Recipient phone number is missing.");
            return;
        }

        try {
            String url = String.format("https://graph.facebook.com/%s/%s/messages", apiVersion, phoneNumberId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(whatsappToken);

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("recipient_type", "individual");
            body.put("to", phoneNumber);
            body.put("type", "text");
            
            Map<String, String> textObj = new HashMap<>();
            textObj.put("preview_url", "false");
            textObj.put("body", message);
            body.put("text", textObj);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, request, String.class);

            logger.info("[WhatsApp] \nRecipient:\n{}\nStatus:\nSUCCESS", phoneNumber);
        } catch (HttpClientErrorException e) {
            logger.error("[WhatsApp] \nRecipient:\n{}\nStatus:\nFAILED\nReason:\nClient Error: {}", phoneNumber, e.getResponseBodyAsString());
            // Do not rethrow, 4xx errors shouldn't be retried or crash app
        } catch (Exception e) {
            logger.error("[WhatsApp] \nRecipient:\n{}\nStatus:\nFAILED\nReason:\n{}", phoneNumber, e.getMessage());
            throw e; // Rethrow to trigger Spring Retry for 5xx and timeouts
        }
    }

    private boolean isConfigured() {
        return whatsappToken != null && !whatsappToken.isBlank()
                && phoneNumberId != null && !phoneNumberId.isBlank();
    }
}
