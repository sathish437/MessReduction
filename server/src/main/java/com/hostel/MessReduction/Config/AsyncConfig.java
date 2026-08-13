package com.hostel.MessReduction.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Provides a dedicated, bounded thread pool for asynchronous FCM / Web Push
 * notification delivery.
 *
 * <p>This replaces the JVM's shared {@code ForkJoinPool.commonPool()} that was
 * previously used by {@code CompletableFuture.runAsync(...)}.  The common pool
 * is shared with parallel streams and other application work; using it for
 * I/O-bound notification delivery can cause starvation under load.
 *
 * <p>Configuration properties (with defaults):
 * <pre>
 *   app.notification.executor.core-pool-size = 4
 *   app.notification.executor.max-pool-size  = 10
 *   app.notification.executor.queue-capacity = 500
 * </pre>
 */
@Configuration
public class AsyncConfig {

    @Value("${app.notification.executor.core-pool-size:4}")
    private int corePoolSize;

    @Value("${app.notification.executor.max-pool-size:10}")
    private int maxPoolSize;

    @Value("${app.notification.executor.queue-capacity:500}")
    private int queueCapacity;

    /**
     * A dedicated bounded executor for FCM and Web Push delivery tasks.
     * Tasks are submitted after the database transaction commits so that
     * a DB rollback never causes a push notification to be sent.
     */
    @Bean(name = "pushNotificationExecutor")
    public Executor pushNotificationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("push-notification-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
