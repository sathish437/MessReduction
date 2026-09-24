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
import java.util.List;

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

    private long lastUpdateId = 0;

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
            sendMessage(chatId, text, "HTML");
        } catch (Exception sendError) {
            // Never let notification failures propagate
            logger.warn("TelegramNotificationService error: {}", sendError.getMessage());
        }
    }

    /**
     * Sends any text message to a specific Telegram chat.
     */
    public void sendMessage(String targetChatId, String text, String parseMode) {
        if (botToken == null || botToken.isBlank() || targetChatId == null || targetChatId.isBlank()) {
            return;
        }
        try {
            String url = TELEGRAM_API_BASE + botToken + "/sendMessage";
            webClient.post()
                    .uri(url)
                    .bodyValue(new TelegramSendMessageRequest(targetChatId, text, parseMode))
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(
                            response -> logger.debug("Telegram message sent successfully"),
                            error    -> logger.warn("Failed to send Telegram message: {}", error.getMessage())
                    );
        } catch (Exception e) {
            logger.warn("Failed to dispatch Telegram message: {}", e.getMessage());
        }
    }

    /**
     * Poll Telegram for incoming bot commands (like /log or /log 50).
     * Runs periodically every 5 seconds.
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 5000)
    public void pollTelegramUpdates() {
        if (botToken == null || botToken.isBlank() || "YOUR_BOT_TOKEN".equals(botToken)) {
            return;
        }

        try {
            String url = TELEGRAM_API_BASE + botToken + "/getUpdates?offset=" + (lastUpdateId + 1) + "&timeout=2";
            TelegramUpdatesResponse response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(TelegramUpdatesResponse.class)
                    .block();

            if (response != null && response.isOk() && response.getResult() != null) {
                for (TelegramUpdatesResponse.TelegramUpdate update : response.getResult()) {
                    if (update.getUpdateId() != null && update.getUpdateId() > lastUpdateId) {
                        lastUpdateId = update.getUpdateId();
                    }
                    if (update.getMessage() != null && update.getMessage().getText() != null) {
                        processTelegramMessage(update.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            // Silently log in debug to prevent log pollution if offline or no network
            logger.debug("Telegram update polling skipped: {}", e.getMessage());
        }
    }

    /**
     * Process an incoming message and handle commands like /log [count].
     */
    public void processTelegramMessage(TelegramUpdatesResponse.TelegramMessage message) {
        String text = message.getText().trim();
        String fromChatId = message.getChat() != null && message.getChat().getId() != null
                ? String.valueOf(message.getChat().getId())
                : chatId;

        // Security check: Only allow configured chatId to query logs
        if (this.chatId != null && !this.chatId.isBlank() && !this.chatId.equals(fromChatId)) {
            logger.warn("Unauthorized Telegram command attempt from chatId: {}", fromChatId);
            return;
        }

        if (text.startsWith("/log")) {
            handleLogCommand(text, fromChatId);
        } else if (text.startsWith("/tail")) {
            handleTailCommand(text, fromChatId);
        } else if (text.equalsIgnoreCase("/start") || text.equalsIgnoreCase("/help")) {
            String help = "\uD83D\uDCD6 <b>MessReduction Bot Commands</b>\n\n"
                    + "• <code>/log</code> - Get last 50 lines of server logs\n"
                    + "• <code>/log &lt;count&gt;</code> - Get last N lines of logs (e.g., <code>/log 100</code>)\n"
                    + "• <code>/tail</code> - Start 1-minute live log tailing in this message\n"
                    + "• <code>/tail &lt;seconds&gt;</code> - Start live tailing for N seconds (e.g., <code>/tail 30</code>)\n";
            sendMessage(fromChatId, help, "HTML");
        }
    }

    /**
     * Start a live tail session in Telegram that edits a single message in-place for 60 seconds.
     */
    public void handleTailCommand(String commandText, String targetChatId) {
        int durationSeconds = 60; // default to 60s (1 minute)
        String[] parts = commandText.trim().split("\\s+");
        if (parts.length > 1) {
            try {
                durationSeconds = Integer.parseInt(parts[1]);
                if (durationSeconds <= 0) durationSeconds = 60;
                if (durationSeconds > 180) durationSeconds = 180; // Cap to 3 minutes
            } catch (NumberFormatException e) {
                durationSeconds = 60;
            }
        }

        final int duration = durationSeconds;
        // Run asynchronously so update polling isn't blocked
        Thread.ofVirtual().start(() -> runLiveTailSession(targetChatId, duration));
    }

    private void runLiveTailSession(String targetChatId, int durationSeconds) {
        try {
            String initialHeader = String.format("\uD83D\uDCE1 <b>Live Tail Started (%ds)</b>\n<i>Connecting to live log stream...</i>", durationSeconds);
            Long messageId = sendAndReturnMessageId(targetChatId, initialHeader, "HTML");

            if (messageId == null) {
                logger.warn("Could not initiate live tail: failed to send initial message");
                return;
            }

            long endTime = System.currentTimeMillis() + (durationSeconds * 1000L);
            String lastRenderedText = "";

            while (System.currentTimeMillis() < endTime) {
                int remaining = Math.max(0, (int) ((endTime - System.currentTimeMillis()) / 1000));
                List<String> logs = MemoryLogAppender.getRecentLogs(25); // display last 25 lines in tail window

                StringBuilder sb = new StringBuilder();
                sb.append(String.format("\uD83D\uDCE1 <b>Live Log Tail (%ds remaining)</b>\n<pre>", remaining));
                for (String line : logs) {
                    sb.append(escapeHtml(line)).append("\n");
                }
                sb.append("</pre>");

                String currentText = sb.toString();
                // Telegram max message size limit safety
                if (currentText.length() > 3900) {
                    currentText = currentText.substring(currentText.length() - 3900);
                    currentText = String.format("\uD83D\uDCE1 <b>Live Log Tail (%ds remaining)</b>\n<pre>...", remaining) + currentText + "</pre>";
                }

                if (!currentText.equals(lastRenderedText)) {
                    editMessage(targetChatId, messageId, currentText, "HTML");
                    lastRenderedText = currentText;
                }

                try {
                    Thread.sleep(2000); // refresh every 2 seconds
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }

            // Tail session concluded
            List<String> finalLogs = MemoryLogAppender.getRecentLogs(25);
            StringBuilder finalSb = new StringBuilder();
            finalSb.append("\u23F9 <b>Live Tail Ended</b>\n<pre>");
            for (String line : finalLogs) {
                finalSb.append(escapeHtml(line)).append("\n");
            }
            finalSb.append("</pre>");
            editMessage(targetChatId, messageId, finalSb.toString(), "HTML");

        } catch (Exception e) {
            logger.warn("Error running live tail session: {}", e.getMessage());
        }
    }

    /**
     * Sends a message and synchronously returns the created message_id.
     */
    public Long sendAndReturnMessageId(String targetChatId, String text, String parseMode) {
        if (botToken == null || botToken.isBlank() || targetChatId == null || targetChatId.isBlank()) {
            return null;
        }
        try {
            String url = TELEGRAM_API_BASE + botToken + "/sendMessage";
            TelegramSendMessageResponse response = webClient.post()
                    .uri(url)
                    .bodyValue(new TelegramSendMessageRequest(targetChatId, text, parseMode))
                    .retrieve()
                    .bodyToMono(TelegramSendMessageResponse.class)
                    .block();

            if (response != null && response.isOk() && response.getResult() != null) {
                return response.getResult().getMessageId();
            }
        } catch (Exception e) {
            logger.warn("Failed to send initial tail message: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Edits an existing message in-place on Telegram.
     */
    public void editMessage(String targetChatId, Long messageId, String text, String parseMode) {
        if (botToken == null || botToken.isBlank() || targetChatId == null || messageId == null) {
            return;
        }
        try {
            String url = TELEGRAM_API_BASE + botToken + "/editMessageText";
            webClient.post()
                    .uri(url)
                    .bodyValue(new TelegramEditMessageRequest(targetChatId, messageId, text, parseMode))
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(
                            response -> logger.debug("Message edited successfully"),
                            error    -> logger.debug("Edit message skipped/rate-limited: {}", error.getMessage())
                    );
        } catch (Exception e) {
            logger.debug("Failed to edit Telegram message: {}", e.getMessage());
        }
    }

    /**
     * Parse and respond to /log [lines] command.
     */
    public void handleLogCommand(String commandText, String targetChatId) {
        int lines = 50; // default to 50 lines
        String[] parts = commandText.trim().split("\\s+");
        if (parts.length > 1) {
            try {
                lines = Integer.parseInt(parts[1]);
                if (lines <= 0) lines = 50;
                if (lines > 300) lines = 300; // Cap to 300 to avoid hitting Telegram message size limit
            } catch (NumberFormatException e) {
                lines = 50;
            }
        }

        List<String> recentLogs = MemoryLogAppender.getRecentLogs(lines);
        if (recentLogs.isEmpty()) {
            sendMessage(targetChatId, "\u2139\uFE0F <b>No logs available in memory buffer.</b>", "HTML");
            return;
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("\uD83D\uDCDC <b>Last %d Lines of Server Logs:</b>\n<pre>", recentLogs.size()));
        
        for (String line : recentLogs) {
            sb.append(escapeHtml(line)).append("\n");
        }
        sb.append("</pre>");

        String output = sb.toString();

        // Telegram maximum message length is 4096 characters.
        // Chunk if exceeding limit.
        if (output.length() <= 4000) {
            sendMessage(targetChatId, output, "HTML");
        } else {
            // Split into safe chunks
            sendChunkedMessage(targetChatId, recentLogs);
        }
    }

    private void sendChunkedMessage(String targetChatId, List<String> logs) {
        StringBuilder chunk = new StringBuilder();
        chunk.append("<pre>");
        for (String logLine : logs) {
            String escaped = escapeHtml(logLine) + "\n";
            if (chunk.length() + escaped.length() > 3800) {
                chunk.append("</pre>");
                sendMessage(targetChatId, chunk.toString(), "HTML");
                chunk = new StringBuilder();
                chunk.append("<pre>");
            }
            chunk.append(escaped);
        }
        if (chunk.length() > "<pre>".length()) {
            chunk.append("</pre>");
            sendMessage(targetChatId, chunk.toString(), "HTML");
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
                com.hostel.MessReduction.utils.DateTimeUtil.nowLocalDateTime().format(FORMATTER),
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
    // Inner request DTOs (Jackson serialises via getters)
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

    @SuppressWarnings("unused")
    private static class TelegramEditMessageRequest {
        private final String chat_id;
        private final Long message_id;
        private final String text;
        private final String parse_mode;

        TelegramEditMessageRequest(String chatId, Long messageId, String text, String parseMode) {
            this.chat_id    = chatId;
            this.message_id = messageId;
            this.text       = text;
            this.parse_mode = parseMode;
        }

        public String getChat_id()    { return chat_id; }
        public Long getMessage_id()   { return message_id; }
        public String getText()        { return text; }
        public String getParse_mode() { return parse_mode; }
    }
}
