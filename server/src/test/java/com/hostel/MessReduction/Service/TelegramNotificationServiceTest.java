package com.hostel.MessReduction.utils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TelegramNotificationServiceTest {

    @Mock
    private WebClient.Builder webClientBuilder;

    @Mock
    private WebClient webClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    private TelegramNotificationService telegramService;

    @BeforeEach
    void setUp() {
        when(webClientBuilder.build()).thenReturn(webClient);
        telegramService = new TelegramNotificationService(webClientBuilder);
        ReflectionTestUtils.setField(telegramService, "botToken", "test-token");
        ReflectionTestUtils.setField(telegramService, "chatId", "12345678");

        MemoryLogAppender.clear();
    }

    @Test
    @DisplayName("MemoryLogAppender accumulates log events and respects requested line limits")
    void testMemoryLogAppender_AccumulatesAndRetrieves() {
        ch.qos.logback.classic.spi.LoggingEvent event1 = new ch.qos.logback.classic.spi.LoggingEvent();
        event1.setTimeStamp(System.currentTimeMillis());
        event1.setMessage("Log message 1");
        event1.setLevel(ch.qos.logback.classic.Level.INFO);
        event1.setLoggerName("com.hostel.TestLogger");
        event1.setThreadName("main");

        ch.qos.logback.classic.spi.LoggingEvent event2 = new ch.qos.logback.classic.spi.LoggingEvent();
        event2.setTimeStamp(System.currentTimeMillis());
        event2.setMessage("Log message 2");
        event2.setLevel(ch.qos.logback.classic.Level.WARN);
        event2.setLoggerName("com.hostel.TestLogger");
        event2.setThreadName("main");

        MemoryLogAppender appender = new MemoryLogAppender();
        appender.append(event1);
        appender.append(event2);

        List<String> logs = MemoryLogAppender.getRecentLogs(1);
        assertEquals(1, logs.size());
        assertTrue(logs.get(0).contains("Log message 2"));

        List<String> allLogs = MemoryLogAppender.getRecentLogs(50);
        assertEquals(2, allLogs.size());
        assertTrue(allLogs.get(0).contains("Log message 1"));
        assertTrue(allLogs.get(1).contains("Log message 2"));
    }

    @Test
    @DisplayName("Telegram command /log parses integer flag and dispatches formatted log response")
    void testHandleLogCommand_WithIntegerFlag() {
        ch.qos.logback.classic.spi.LoggingEvent event = new ch.qos.logback.classic.spi.LoggingEvent();
        event.setTimeStamp(System.currentTimeMillis());
        event.setMessage("Database connected successfully");
        event.setLevel(ch.qos.logback.classic.Level.INFO);
        event.setLoggerName("com.hostel.Repo");
        event.setThreadName("main");

        MemoryLogAppender appender = new MemoryLogAppender();
        appender.append(event);

        TelegramNotificationService spyService = spy(telegramService);
        doNothing().when(spyService).sendMessage(any(), any(), any());

        // Process /log 20 command
        TelegramUpdatesResponse.TelegramMessage message = new TelegramUpdatesResponse.TelegramMessage();
        message.setText("/log 20");
        TelegramUpdatesResponse.TelegramChat chat = new TelegramUpdatesResponse.TelegramChat();
        chat.setId(12345678L);
        message.setChat(chat);

        spyService.processTelegramMessage(message);

        ArgumentCaptor<String> textCaptor = ArgumentCaptor.forClass(String.class);
        verify(spyService, times(1)).sendMessage(eq("12345678"), textCaptor.capture(), eq("HTML"));

        String sentText = textCaptor.getValue();
        assertTrue(sentText.contains("Last 1 Lines of Server Logs:"));
        assertTrue(sentText.contains("Database connected successfully"));
    }

    @Test
    @DisplayName("Telegram command from unknown chatId is blocked")
    void testHandleLogCommand_UnauthorizedChatId_Ignored() {
        TelegramNotificationService spyService = spy(telegramService);

        TelegramUpdatesResponse.TelegramMessage message = new TelegramUpdatesResponse.TelegramMessage();
        message.setText("/log 50");
        TelegramUpdatesResponse.TelegramChat chat = new TelegramUpdatesResponse.TelegramChat();
        chat.setId(99999999L); // Malicious / untrusted chat ID
        message.setChat(chat);

        spyService.processTelegramMessage(message);

        verify(spyService, never()).sendMessage(any(), any(), any());
    }

    @Test
    @DisplayName("Telegram command /tail dispatches live tail session and edits message in-place")
    void testHandleTailCommand_StartsLiveTail() {
        TelegramNotificationService spyService = spy(telegramService);
        doReturn(1001L).when(spyService).sendAndReturnMessageId(any(), any(), any());
        doNothing().when(spyService).editMessage(any(), any(), any(), any());

        // Process /tail 1 command (1-second session for test)
        TelegramUpdatesResponse.TelegramMessage message = new TelegramUpdatesResponse.TelegramMessage();
        message.setText("/tail 1");
        TelegramUpdatesResponse.TelegramChat chat = new TelegramUpdatesResponse.TelegramChat();
        chat.setId(12345678L);
        message.setChat(chat);

        spyService.processTelegramMessage(message);

        verify(spyService, timeout(2500).atLeastOnce()).sendAndReturnMessageId(eq("12345678"), any(), eq("HTML"));
        verify(spyService, timeout(2500).atLeastOnce()).editMessage(eq("12345678"), eq(1001L), any(), eq("HTML"));
    }
}
