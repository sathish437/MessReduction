package com.hostel.MessReduction.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class TelegramNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(TelegramNotificationService.class);
    private static final String TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage";

    @Value("${telegram.bot.token:}")
    private String botToken;

    @Value("${telegram.group.chat.id:}")
    private String chatId;

    private final RestTemplate restTemplate;

    public TelegramNotificationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void sendGroupNotification(String message) {
        try {
            if (botToken == null || botToken.trim().isEmpty() || chatId == null || chatId.trim().isEmpty()) {
                logger.warn("Telegram bot token or chat ID is not configured. Skipping notification.");
                return;
            }

            String url = TELEGRAM_API_URL.replace("{token}", botToken);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("chat_id", chatId);
            requestBody.put("text", message);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.info("Successfully sent Telegram notification.");
            } else {
                logger.warn("Failed to send Telegram notification. Response: {}", response.getBody());
            }
        } catch (Exception e) {
            logger.error("Error occurred while sending Telegram notification: {}", e.getMessage());
            // Exception is caught and not rethrown to avoid interrupting the main workflow
        }
    }

    public void sendAggregatedGroupNotification(java.util.List<com.hostel.MessReduction.Entity.ReductionForm> forms, String headerTitle) {
        if (forms == null || forms.isEmpty()) return;

        StringBuilder sb = new StringBuilder();
        sb.append(headerTitle).append("\n\n");
        sb.append("Total Pending Requests: ").append(forms.size()).append("\n\n");

        for (com.hostel.MessReduction.Entity.ReductionForm form : forms) {
            sb.append("#").append(form.getFormId()).append(" - ").append(form.getStudentDetails().getName()).append("\n");
        }
        
        sb.append("\nPlease log in to review and process pending requests.");

        sendGroupNotification(sb.toString());
    }
}
