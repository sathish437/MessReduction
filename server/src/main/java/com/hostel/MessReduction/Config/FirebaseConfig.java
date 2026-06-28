package com.hostel.MessReduction.Config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import jakarta.annotation.PostConstruct;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.config.path}")
    private Resource firebaseConfigPath;

    @PostConstruct
    public void initialize() {
        if (firebaseConfigPath == null || !firebaseConfigPath.exists()) {
            logger.warn("Firebase service account not found. Firebase notifications are disabled.");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(firebaseConfigPath.getInputStream()))
                        .build();

                FirebaseApp.initializeApp(options);
                logger.info("Firebase application has been initialized successfully.");
            }
        } catch (IOException e) {
            logger.error("Failed to initialize Firebase app: {}", e.getMessage());
        }
    }
}
