package com.hostel.MessReduction.Service;

import com.hostel.MessReduction.CustomException.InvalidCredentialsException;
import com.hostel.MessReduction.DTO.ResDTO.AuthResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HostelSsoServiceTest {

    private static final String SECRET = "test_shared_secret_at_least_32_bytes_long";

    @Mock
    private StudentAuthService studentAuthService;

    private HostelSsoService ssoService;
    private AuthResponseDTO sampleResponse;

    @BeforeEach
    void setUp() {
        ssoService = new HostelSsoService(studentAuthService, SECRET, 60L, "");
        sampleResponse = new AuthResponseDTO("jwt-token-123", 1L, "Alice", "730421104001", "21CS001", false);
    }

    @Test
    void testVerifyAndExchange_Success_SingleUse() {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        String nonce = "unique-nonce-1";
        String regno = "730421104001";
        String sig = HostelSsoService.computeSignature(SECRET, ts, nonce, regno);

        when(studentAuthService.loginBySsoIdentifier(regno)).thenReturn(sampleResponse);

        String code = ssoService.verifyAndCreateSsoCode(ts, nonce, regno, sig);
        assertNotNull(code);
        assertFalse(code.isBlank());

        AuthResponseDTO exchanged = ssoService.exchangeCode(code);
        assertEquals("jwt-token-123", exchanged.getToken());
        assertEquals("730421104001", exchanged.getRegisterNo());

        // Second exchange of the same code must fail
        assertThrows(InvalidCredentialsException.class, () -> ssoService.exchangeCode(code));
    }

    @Test
    void testVerify_NotConfigured() {
        HostelSsoService unconfigured = new HostelSsoService(studentAuthService, "", 60L, "");
        HostelSsoService.SsoException ex = assertThrows(
                HostelSsoService.SsoException.class,
                () -> unconfigured.verifyAndCreateSsoCode("123", "n", "730421104001", "sig")
        );
        assertEquals("sso_not_configured", ex.getErrorCode());
    }

    @Test
    void testVerify_MissingOrInvalidParams() {
        HostelSsoService.SsoException missingEx = assertThrows(
                HostelSsoService.SsoException.class,
                () -> ssoService.verifyAndCreateSsoCode("", "n", "730421104001", "sig")
        );
        assertEquals("sso_invalid_request", missingEx.getErrorCode());

        HostelSsoService.SsoException badTsEx = assertThrows(
                HostelSsoService.SsoException.class,
                () -> ssoService.verifyAndCreateSsoCode("not-a-number", "n", "730421104001", "sig")
        );
        assertEquals("sso_invalid_request", badTsEx.getErrorCode());
    }

    @Test
    void testVerify_ExpiredTimestamp() {
        String expiredTs = String.valueOf(Instant.now().getEpochSecond() - 120);
        String nonce = "unique-nonce-expired";
        String regno = "730421104001";
        String sig = HostelSsoService.computeSignature(SECRET, expiredTs, nonce, regno);

        HostelSsoService.SsoException ex = assertThrows(
                HostelSsoService.SsoException.class,
                () -> ssoService.verifyAndCreateSsoCode(expiredTs, nonce, regno, sig)
        );
        assertEquals("sso_expired", ex.getErrorCode());
        verifyNoInteractions(studentAuthService);
    }

    @Test
    void testVerify_InvalidSignature() {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        HostelSsoService.SsoException ex = assertThrows(
                HostelSsoService.SsoException.class,
                () -> ssoService.verifyAndCreateSsoCode(ts, "nonce-bad-sig", "730421104001", "deadbeef")
        );
        assertEquals("sso_invalid_signature", ex.getErrorCode());
        verifyNoInteractions(studentAuthService);
    }

    @Test
    void testVerify_NonceReplayRejected() {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        String nonce = "replayed-nonce";
        String regno = "730421104001";
        String sig = HostelSsoService.computeSignature(SECRET, ts, nonce, regno);

        when(studentAuthService.loginBySsoIdentifier(regno)).thenReturn(sampleResponse);

        ssoService.verifyAndCreateSsoCode(ts, nonce, regno, sig);

        HostelSsoService.SsoException ex = assertThrows(
                HostelSsoService.SsoException.class,
                () -> ssoService.verifyAndCreateSsoCode(ts, nonce, regno, sig)
        );
        assertEquals("sso_replay", ex.getErrorCode());
    }

    @Test
    void testVerify_DisabledAccountMapped() {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        String nonce = "nonce-disabled";
        String regno = "730421104001";
        String sig = HostelSsoService.computeSignature(SECRET, ts, nonce, regno);

        when(studentAuthService.loginBySsoIdentifier(regno))
                .thenThrow(new InvalidCredentialsException("Your hostel account is currently disabled."));

        HostelSsoService.SsoException ex = assertThrows(
                HostelSsoService.SsoException.class,
                () -> ssoService.verifyAndCreateSsoCode(ts, nonce, regno, sig)
        );
        assertEquals("sso_account_disabled", ex.getErrorCode());
    }

    @Test
    void testBuildFrontendRedirectUrl() {
        assertEquals("/sso-callback?code=abc", ssoService.buildFrontendRedirectUrl("/sso-callback?code=abc"));

        HostelSsoService withBase = new HostelSsoService(studentAuthService, SECRET, 60L, "https://mess.gces.net.in/");
        assertEquals("https://mess.gces.net.in/sso-callback?code=abc",
                withBase.buildFrontendRedirectUrl("/sso-callback?code=abc"));
    }
}
