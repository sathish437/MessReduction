package com.hostel.MessReduction.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String emailId, Long studentId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("studentId", studentId);
        claims.put("role", "STUDENT");
        return createToken(claims, emailId);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmailId(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("role", String.class);
    }

    public Long extractStudentId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("studentId", Long.class);
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    private Claims extractAllClaims(String token) {
        // Use parser() then build() to obtain JwtParser, then parse the JWS
        return Jwts.parser()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, String emailId) {
        try {
            final String extractedEmailId = extractEmailId(token);
            boolean isValid = extractedEmailId.equals(emailId) && !isTokenExpired(token);
            System.out.println("JWT Validation - extractedEmailId: " + extractedEmailId + ", providedEmailId: " + emailId + ", isValid: " + isValid);
            return isValid;
        } catch (Exception e) {
            System.out.println("JWT Validation failed: " + e.getMessage());
            return false;
        }
    }
}
