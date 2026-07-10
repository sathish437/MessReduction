package com.hostel.MessReduction.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
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

    @Value("${whatsapp.enabled:false}")
    private boolean whatsappEnabled;

    @Value("${whatsapp.meta.token:}")
    private String whatsappToken;

    @Value("${whatsapp.meta.phone-number-id:}")
    private String phoneNumberId;

    @Value("${whatsapp.meta.api-version:v25.0}")
    private String apiVersion;

    @Value("${whatsapp.sandbox.enabled:false}")
    private boolean sandboxEnabled;

    private final RestTemplate restTemplate;

    public WhatsAppService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Sends a normal WhatsApp text message synchronously.
     * Retries up to 3 times on connection errors or 5xx server errors.
     * Does NOT retry on 4xx client errors in the same run, but propagates exception
     * so the scheduler keeps it PENDING.
     */
    @Retryable(
        retryFor = { HttpServerErrorException.class, ResourceAccessException.class },
        noRetryFor = { HttpClientErrorException.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public void sendTextMessage(String phoneNumber, String message) {
        if (!whatsappEnabled) {
            logger.info("[WhatsApp] WhatsApp service is disabled. Skipping text message.");
            return;
        }

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

            // Detailed Pre-Request Logging (Step 5, 13)
            logger.info("\n====================================================" +
                        "\n[WhatsApp] [Meta Request] Before request" +
                        "\nRecipient Number: {}" +
                        "\nMessage: {}" +
                        "\nHeaders: {}" +
                        "\nPayload: {}" +
                        "\nEndpoint: {}" +
                        "\n====================================================",
                        phoneNumber, message, headers, body, url);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            var response = restTemplate.postForEntity(url, request, String.class);

            // Detailed Post-Request Logging - Success
            logger.info("\n====================================================" +
                        "\n[WhatsApp] [Meta Response] After request (SUCCESS)" +
                        "\nHTTP Status: {}" +
                        "\nResponse Body: {}" +
                        "\n====================================================",
                        response.getStatusCode(), response.getBody());

        } catch (HttpClientErrorException e) {
            // Detailed Post-Request Logging - 4xx Error (Step 5, 9)
            logger.error("\n====================================================" +
                         "\n[WhatsApp] [Meta Response - Error] After request (CLIENT ERROR)" +
                         "\nHTTP Status: {}" +
                         "\nError Body: {}" +
                         "\nMeta Error Message: {}" +
                         "\n====================================================",
                         e.getStatusCode(), e.getResponseBodyAsString(), e.getMessage());
            throw e; // Rethrow so scheduler knows it failed (Step 10)
        } catch (HttpServerErrorException e) {
            // Detailed Post-Request Logging - 5xx Error
            logger.error("\n====================================================" +
                         "\n[WhatsApp] [Meta Response - Error] After request (SERVER ERROR)" +
                         "\nHTTP Status: {}" +
                         "\nError Body: {}" +
                         "\n====================================================",
                         e.getStatusCode(), e.getResponseBodyAsString());
            throw e; // Rethrow to trigger Spring Retry and then to scheduler
        } catch (Exception e) {
            // Detailed Post-Request Logging - Other Error
            logger.error("\n====================================================" +
                         "\n[WhatsApp] [Meta Response - Error] After request (OTHER ERROR)" +
                         "\nException: {}" +
                         "\n====================================================",
                         e.getMessage());
            throw e; // Rethrow
        }
    }

    /**
     * Sends a template WhatsApp message synchronously.
     * Retries up to 3 times on connection errors or 5xx server errors.
     * Does NOT retry on 4xx client errors.
     */
    @Retryable(
        retryFor = { HttpServerErrorException.class, ResourceAccessException.class },
        noRetryFor = { HttpClientErrorException.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public void sendTemplateMessage(String phoneNumber, String templateName, java.util.List<String> parameters) {
        if (!whatsappEnabled) {
            logger.info("[WhatsApp] WhatsApp service is disabled. Skipping template message.");
            return;
        }

        if (!isConfigured()) {
            logger.warn("[WhatsApp] Meta Cloud API credentials are not configured. Skipping template notification.");
            return;
        }

        if (phoneNumber == null || phoneNumber.isBlank()) {
            logger.warn("[WhatsApp] Skipping template notification. Recipient phone number is missing.");
            return;
        }

        try {
            String url = String.format("https://graph.facebook.com/%s/%s/messages", apiVersion, phoneNumberId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(whatsappToken);

            Map<String, Object> body = new HashMap<>();
            body.put("messaging_product", "whatsapp");
            body.put("to", phoneNumber);
            body.put("type", "template");
            
            // Sandbox override to bypass Meta strict template restrictions during development
            if (sandboxEnabled) {
                String fallbackText = (parameters != null && !parameters.isEmpty()) ? parameters.get(0) : "Hello from Mess Reduction Sandbox!";
                logger.info("[WhatsApp] Sandbox mode enabled. Sending template '{}' as a standard TEXT message to bypass Meta template restrictions.", templateName);
                sendTextMessage(phoneNumber, fallbackText);
                return; // Exit template flow
            }

            // Build the template object payload
            Map<String, Object> templateObj = WhatsAppTemplates.buildTemplatePayload(templateName, "en_US", parameters);
            body.put("template", templateObj);

            logger.info("\n====================================================" +
                        "\n[WhatsApp] [Meta Request] Before request (TEMPLATE)" +
                        "\nRecipient Number: {}" +
                        "\nTemplate Name: {}" +
                        "\nHeaders: {}" +
                        "\nPayload: {}" +
                        "\nEndpoint: {}" +
                        "\n====================================================",
                        phoneNumber, templateName, headers, body, url);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            var response = restTemplate.postForEntity(url, request, String.class);

            logger.info("\n====================================================" +
                        "\n[WhatsApp] [Meta Response] After request (SUCCESS)" +
                        "\nHTTP Status: {}" +
                        "\nResponse Body: {}" +
                        "\n====================================================",
                        response.getStatusCode(), response.getBody());

        } catch (HttpClientErrorException e) {
            logger.error("\n====================================================" +
                         "\n[WhatsApp] [Meta Response - Error] After request (CLIENT ERROR)" +
                         "\nHTTP Status: {}" +
                         "\nError Body: {}" +
                         "\nMeta Error Message: {}" +
                         "\n====================================================",
                         e.getStatusCode(), e.getResponseBodyAsString(), e.getMessage());
            throw e;
        } catch (HttpServerErrorException e) {
            logger.error("\n====================================================" +
                         "\n[WhatsApp] [Meta Response - Error] After request (SERVER ERROR)" +
                         "\nHTTP Status: {}" +
                         "\nError Body: {}" +
                         "\n====================================================",
                         e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            logger.error("\n====================================================" +
                         "\n[WhatsApp] [Meta Response - Error] After request (OTHER ERROR)" +
                         "\nException: {}" +
                         "\n====================================================",
                         e.getMessage());
            throw e;
        }
    }

    private boolean isConfigured() {
        return whatsappToken != null && !whatsappToken.isBlank()
                && phoneNumberId != null && !phoneNumberId.isBlank();
    }
}
