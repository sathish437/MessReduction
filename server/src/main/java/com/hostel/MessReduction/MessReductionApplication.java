package com.hostel.MessReduction;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableRetry
public class MessReductionApplication {

	@PostConstruct
	public void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));

		// Register in-memory log appender for live Telegram /log command
		try {
			ch.qos.logback.classic.Logger rootLogger = (ch.qos.logback.classic.Logger) org.slf4j.LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
			ch.qos.logback.classic.LoggerContext context = rootLogger.getLoggerContext();
			com.hostel.MessReduction.utils.MemoryLogAppender appender = new com.hostel.MessReduction.utils.MemoryLogAppender();
			appender.setContext(context);
			appender.setName("MEMORY_LOG_APPENDER");
			appender.start();
			rootLogger.addAppender(appender);
		} catch (Exception e) {
			org.slf4j.LoggerFactory.getLogger(MessReductionApplication.class).warn("Failed to attach MemoryLogAppender: {}", e.getMessage());
		}
	}

	public static void main(String[] args) {
		SpringApplication.run(MessReductionApplication.class, args);
	}
}
