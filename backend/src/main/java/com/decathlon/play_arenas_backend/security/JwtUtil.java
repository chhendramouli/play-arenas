package com.decathlon.play_arenas_backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // Set jwt.secret in application.properties or JWT_SECRET env var — no default to avoid accidental insecure deploys
    @Value("${jwt.secret:${JWT_SECRET:decathlon-play-dev-secret-change-in-production}}")
    private String secret;

    @Value("${jwt.expiry-ms:86400000}") // 24 hours
    private long expiryMs;

    private SecretKey key() {
        byte[] bytes = Decoders.BASE64.decode(
            java.util.Base64.getEncoder().encodeToString(secret.getBytes())
        );
        return Keys.hmacShaKeyFor(bytes);
    }

    public String generate(String email, String role) {
        return Jwts.builder()
            .subject(email)
            .claim("role", role)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiryMs))
            .signWith(key())
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(key())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String extractEmail(String token) {
        return parse(token).getSubject();
    }

    public boolean isValid(String token) {
        try { parse(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }
}
