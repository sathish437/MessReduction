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
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${FIREBASE_PROJECT_ID:${firebase.project.id:}}")
    private String projectId;

    @Value("${FIREBASE_CLIENT_EMAIL:${firebase.client.email:}}")
    private String clientEmail;

    @Value("${FIREBASE_PRIVATE_KEY:${firebase.private.key:}}")
    private String privateKey;

    @Value("${FIREBASE_PRIVATE_KEY_ID:${firebase.private.key.id:}}")
    private String privateKeyId;

    @Value("${FIREBASE_CLIENT_ID:${firebase.client.id:}}")
    private String clientId;

    @Value("${firebase.config.path:classpath:firebase-service-account.json}")
    private Resource firebaseConfigPath;

    private boolean initialized = false;

    @PostConstruct
    public void initialize() {
        logger.info("Firebase initialization started");

        if (!FirebaseApp.getApps().isEmpty()) {
            this.initialized = true;
            logger.info("Firebase application already initialized.");
            return;
        }

        try {
            GoogleCredentials credentials = resolveCredentials();

            if (credentials == null) {
                logger.warn("Firebase credentials not configured (no environment variables or valid service-account JSON). Firebase notifications are disabled.");
                this.initialized = false;
                return;
            }

            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                    .setCredentials(credentials);

            if (projectId != null && !projectId.trim().isEmpty()) {
                optionsBuilder.setProjectId(projectId.trim());
            }

            FirebaseApp.initializeApp(optionsBuilder.build());
            this.initialized = true;
            logger.info("Firebase initialized successfully");

        } catch (Exception e) {
            this.initialized = false;
            logger.error("Firebase initialization failed: {}", e.getMessage());
        }
    }

    public boolean isInitialized() {
        return this.initialized && !FirebaseApp.getApps().isEmpty();
    }

    private GoogleCredentials resolveCredentials() throws IOException {
        // Priority 1: Service account JSON file if present
        if (firebaseConfigPath != null && firebaseConfigPath.exists()) {
            logger.info("Loading Firebase credentials from config file resource: {}", firebaseConfigPath.getFilename());
            try (InputStream is = firebaseConfigPath.getInputStream()) {
                return GoogleCredentials.fromStream(is);
            }
        }

        // Priority 2: Environment variables (Project ID, Client Email, Private Key)
        if (hasText(clientEmail) && hasText(privateKey)) {
            logger.info("Loading Firebase credentials from environment variables");
            String cleanPrivateKey = privateKey.trim();
            if ((cleanPrivateKey.startsWith("\"") && cleanPrivateKey.endsWith("\"")) ||
                (cleanPrivateKey.startsWith("'") && cleanPrivateKey.endsWith("'"))) {
                if (cleanPrivateKey.length() > 1) {
                    cleanPrivateKey = cleanPrivateKey.substring(1, cleanPrivateKey.length() - 1);
                }
            }
            cleanPrivateKey = cleanPrivateKey.replace("\r", "").replace("\\n", "\n").trim();
            
            String cleanClientEmail = clientEmail.trim();
            if ((cleanClientEmail.startsWith("\"") && cleanClientEmail.endsWith("\"")) ||
                (cleanClientEmail.startsWith("'") && cleanClientEmail.endsWith("'"))) {
                if (cleanClientEmail.length() > 1) {
                    cleanClientEmail = cleanClientEmail.substring(1, cleanClientEmail.length() - 1);
                }
            }
            
            String cleanProjectId = hasText(projectId) ? projectId.trim() : "fcm-notification7";
            if ((cleanProjectId.startsWith("\"") && cleanProjectId.endsWith("\"")) ||
                (cleanProjectId.startsWith("'") && cleanProjectId.endsWith("'"))) {
                if (cleanProjectId.length() > 1) {
                    cleanProjectId = cleanProjectId.substring(1, cleanProjectId.length() - 1);
                }
            }

            String cleanKeyId = hasText(privateKeyId) ? privateKeyId.trim() : "40cc1c1a8dac7d1a7e5d5b1be28c68b5ff9778b0";
            String cleanClientId = hasText(clientId) ? clientId.trim() : "112052373606800360168";

            String serviceAccountJson = buildServiceAccountJson(cleanProjectId, cleanClientEmail, cleanPrivateKey, cleanKeyId, cleanClientId);
            try (InputStream stream = new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8))) {
                return GoogleCredentials.fromStream(stream);
            }
        }

        return null;
    }

    private String buildServiceAccountJson(String projId, String email, String privKey, String keyId, String clId) {
        return "{\n" +
                "  \"type\": \"service_account\",\n" +
                "  \"project_id\": \"" + escapeJson(projId) + "\",\n" +
                "  \"private_key_id\": \"" + escapeJson(keyId) + "\",\n" +
                "  \"private_key\": \"" + escapeJson(privKey) + "\",\n" +
                "  \"client_email\": \"" + escapeJson(email) + "\",\n" +
                "  \"client_id\": \"" + escapeJson(clId) + "\",\n" +
                "  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n" +
                "  \"token_uri\": \"https://oauth2.googleapis.com/token\",\n" +
                "  \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\n" +
                "  \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/" + escapeJson(email) + "\"\n" +
                "}";
    }

    private String escapeJson(String raw) {
        if (raw == null) return "";
        return raw.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private boolean hasText(String str) {
        return str != null && !str.trim().isEmpty();
    }
}
