package com.hostel.MessReduction.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Sends a Telegram message to the configured chat whenever a server-side
 * exception is detected.
 *
 * Configure in application.properties (or environment variables):
 *   telegram.bot.token   – the Bot API token
 *   telegram.chat.id     – the target chat / user id
 */
@Service
public class TelegramNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(TelegramNotificationService.class);

    private static final String TELEGRAM_API_BASE = "https://api.telegram.org/bot";
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.chat.id}")
    private String chatId;

    private final WebClient webClient;

    public TelegramNotificationService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Sends an alert message to Telegram asynchronously (fire-and-forget).
     * Failures are silently logged so they never affect the HTTP response.
     *
     * @param ex      the exception that was caught
     * @param context a short description of where / what triggered the exception
     */
    public void sendExceptionAlert(Exception ex, String context) {
        try {
            String text = buildMessage(ex, context);
            String url  = TELEGRAM_API_BASE + botToken + "/sendMessage";

            webClient.post()
                    .uri(url)
                    .bodyValue(new TelegramSendMessageRequest(chatId, text, "HTML"))
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(
                            response -> logger.debug("Telegram alert sent successfully"),
                            error    -> logger.warn("Failed to send Telegram alert: {}", error.getMessage())
                    );

        } catch (Exception sendError) {
            // Never let notification failures propagate
            logger.warn("TelegramNotificationService error: {}", sendError.getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // helpers
    // -------------------------------------------------------------------------

    private String buildMessage(Exception ex, String context) {
        String stackTrace = getTopStackTrace(ex, 6);
        return String.format(
                "\uD83D\uDEA8 <b>Server Exception Alert</b>\n\n" +
                "\u23F0 <b>Time:</b> %s\n" +
                "\uD83D\uDCCD <b>Context:</b> %s\n" +
                "\u274C <b>Exception:</b> %s\n" +
                "\uD83D\uDCAC <b>Message:</b> %s\n\n" +
                "<b>Stack Trace (top):</b>\n<pre>%s</pre>",
                LocalDateTime.now().format(FORMATTER),
                escapeHtml(context),
                escapeHtml(ex.getClass().getSimpleName()),
                escapeHtml(ex.getMessage() != null ? ex.getMessage() : "N/A"),
                escapeHtml(stackTrace)
        );
    }

    private String getTopStackTrace(Exception ex, int maxLines) {
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        String[] lines = sw.toString().split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(maxLines, lines.length); i++) {
            sb.append(lines[i]).append("\n");
        }
        return sb.toString().trim();
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;");
    }

    // -------------------------------------------------------------------------
    // Inner request DTO (Jackson serialises via getters)
    // -------------------------------------------------------------------------

    @SuppressWarnings("unused")
    private static class TelegramSendMessageRequest {
        private final String chat_id;
        private final String text;
        private final String parse_mode;

        TelegramSendMessageRequest(String chatId, String text, String parseMode) {
            this.chat_id    = chatId;
            this.text       = text;
            this.parse_mode = parseMode;
        }

        public String getChat_id()    { return chat_id; }
        public String getText()        { return text; }
        public String getParse_mode() { return parse_mode; }
    }
}
