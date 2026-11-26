package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class HostelSsoService {

    private static final Logger logger = LoggerFactory.getLogger(HostelSsoService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String SSO_DOMAIN_PREFIX = "HOSTEL_STUDENT_SSO";
    private static final long CODE_TTL_SECONDS = 60L;

    private final StudentAuthService studentAuthService;
    private final String ssoSecret;
    private final long timestampWindowSeconds;
    private final String frontendUrl;
    private final SecureRandom secureRandom = new SecureRandom();

    private final ConcurrentHashMap<String, Instant> usedNonces = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, SsoCodeEntry> ssoCodes = new ConcurrentHashMap<>();

    public HostelSsoService(
            StudentAuthService studentAuthService,
            @Value("${app.hostel.sso-secret:}") String ssoSecret,
            @Value("${app.hostel.sso-window-seconds:60}") long timestampWindowSeconds,
            @Value("${app.frontend.url:}") String frontendUrl) {
        this.studentAuthService = studentAuthService;
        this.ssoSecret = ssoSecret != null ? ssoSecret.trim() : "";
        this.timestampWindowSeconds = timestampWindowSeconds > 0 ? timestampWindowSeconds : 60L;
        this.frontendUrl = frontendUrl != null ? frontendUrl.trim().replaceAll("/+$", "") : "";
    }

    public boolean isConfigured() {
        return !ssoSecret.isEmpty();
    }

    /**
     * Verifies the signed HostelApp student SSO request, authenticates the student,
     * and returns a short-lived one-time code for frontend exchange.
     */
    public String verifyAndCreateSsoCode(String ts, String nonce, String regno, String sig) {
        if (!isConfigured()) {
            logger.error("Hostel Student SSO rejected: MESSREDUCTION_SSO_SECRET is not configured.");
            throw new SsoException("sso_not_configured", "Student SSO is not configured.");
        }

        if (isBlank(ts) || isBlank(nonce) || isBlank(regno) || isBlank(sig)) {
            logger.warn("Hostel Student SSO rejected: missing required parameters.");
            throw new SsoException("sso_invalid_request", "Missing required SSO parameters.");
        }

        String trimmedTs = ts.trim();
        String trimmedNonce = nonce.trim();
        String trimmedRegno = regno.trim();
        String trimmedSig = sig.trim().toLowerCase(Locale.ROOT);

        long tsEpoch;
        try {
            tsEpoch = Long.parseLong(trimmedTs);
        } catch (NumberFormatException e) {
            logger.warn("Hostel Student SSO rejected: non-numeric timestamp '{}'.", trimmedTs);
            throw new SsoException("sso_invalid_request", "Invalid SSO timestamp.");
        }

        Instant now = Instant.now();
        if (Math.abs(now.getEpochSecond() - tsEpoch) > timestampWindowSeconds) {
            logger.warn("Hostel Student SSO rejected: expired timestamp {} (now={}).", tsEpoch, now.getEpochSecond());
            throw new SsoException("sso_expired", "SSO request has expired.");
        }

        String expectedSig = computeSignature(ssoSecret, trimmedTs, trimmedNonce, trimmedRegno);
        if (!MessageDigest.isEqual(
                expectedSig.getBytes(StandardCharsets.UTF_8),
                trimmedSig.getBytes(StandardCharsets.UTF_8))) {
            logger.warn("Hostel Student SSO rejected: signature mismatch for regno '{}'.", trimmedRegno);
            throw new SsoException("sso_invalid_signature", "Invalid SSO signature.");
        }

        if (usedNonces.size() > 1000) {
            cleanupExpiredEntries();
        }
        Instant nonceExpiry = now.plusSeconds(timestampWindowSeconds * 2);
        if (usedNonces.putIfAbsent(trimmedNonce, nonceExpiry) != null) {
            logger.warn("Hostel Student SSO rejected: replayed nonce for regno '{}'.", trimmedRegno);
            throw new SsoException("sso_replay", "SSO request has already been used.");
        }

        AuthResponseDTO authResponse;
        try {
            authResponse = studentAuthService.loginBySsoIdentifier(trimmedRegno);
        } catch (InvalidCredentialsException e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase(Locale.ROOT) : "";
            String errorCode = msg.contains("disabled") ? "sso_account_disabled" : "sso_user_not_found";
            throw new SsoException(errorCode, e.getMessage());
        }

        String code = generateOneTimeCode();
        ssoCodes.put(code, new SsoCodeEntry(authResponse, now.plusSeconds(CODE_TTL_SECONDS)));
        return code;
    }

    /**
     * Exchanges a short-lived one-time SSO code for the student's JWT AuthResponseDTO.
     */
    public AuthResponseDTO exchangeCode(String code) {
        if (isBlank(code)) {
            throw new InvalidCredentialsException("Invalid or expired SSO code.");
        }

        SsoCodeEntry entry = ssoCodes.remove(code.trim());
        if (entry == null || Instant.now().isAfter(entry.expiresAt())) {
            throw new InvalidCredentialsException("Invalid or expired SSO code.");
        }

        return entry.authResponse();
    }

    public String buildFrontendRedirectUrl(String pathWithQuery) {
        if (frontendUrl.isEmpty()) {
            return pathWithQuery;
        }
        return frontendUrl + pathWithQuery;
    }

    @Scheduled(fixedDelay = 60_000)
    public void cleanupExpiredEntries() {
        Instant now = Instant.now();
        usedNonces.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
        ssoCodes.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
    }

    static String computeSignature(String secret, String ts, String nonce, String regno) {
        try {
            String canonical = SSO_DOMAIN_PREFIX + "\n" + ts + "\n" + nonce + "\n" + regno;
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] raw = mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(raw.length * 2);
            for (byte b : raw) {
                hex.append(String.format("%02x", b & 0xff));
            }
            return hex.toString();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to compute HMAC-SHA256 signature", e);
        }
    }

    private String generateOneTimeCode() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private record SsoCodeEntry(AuthResponseDTO authResponse, Instant expiresAt) {
    }

    public static class SsoException extends RuntimeException {
        private final String errorCode;

        public SsoException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }
}
