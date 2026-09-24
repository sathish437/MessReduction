package com.hostel.MessReduction.utils;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * In-memory circular buffer log appender that keeps the most recent log lines.
 * Thread-safe and light on memory.
 */
public class MemoryLogAppender extends AppenderBase<ILoggingEvent> {

    private static final int MAX_CAPACITY = 1000;
    private static final Deque<String> LOG_BUFFER = new ArrayDeque<>(MAX_CAPACITY);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of("Asia/Kolkata"));

    @Override
    protected void append(ILoggingEvent event) {
        if (event == null) return;

        String formattedDate = FORMATTER.format(Instant.ofEpochMilli(event.getTimeStamp()));
        String line = String.format("%s [%s] %-5s %s - %s",
                formattedDate,
                event.getThreadName(),
                event.getLevel().toString(),
                event.getLoggerName(),
                event.getFormattedMessage()
        );

        synchronized (LOG_BUFFER) {
            if (LOG_BUFFER.size() >= MAX_CAPACITY) {
                LOG_BUFFER.pollFirst();
            }
            LOG_BUFFER.addLast(line);
        }
    }

    /**
     * Retrieve the last N lines from the memory buffer.
     *
     * @param count number of lines requested
     * @return List of log strings from oldest to newest
     */
    public static List<String> getRecentLogs(int count) {
        if (count <= 0) {
            count = 50;
        }
        synchronized (LOG_BUFFER) {
            int actualCount = Math.min(count, LOG_BUFFER.size());
            List<String> result = new ArrayList<>(actualCount);
            int skip = LOG_BUFFER.size() - actualCount;
            int current = 0;
            for (String line : LOG_BUFFER) {
                if (current >= skip) {
                    result.add(line);
                }
                current++;
            }
            return result;
        }
    }

    /**
     * Clear buffer (useful for testing or maintenance).
     */
    public static void clear() {
        synchronized (LOG_BUFFER) {
            LOG_BUFFER.clear();
        }
    }

    public static int size() {
        synchronized (LOG_BUFFER) {
            return LOG_BUFFER.size();
        }
    }
}
