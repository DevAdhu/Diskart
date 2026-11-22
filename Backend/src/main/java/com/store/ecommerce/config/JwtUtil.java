package com.store.ecommerce.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration}")
    private long expiration;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String email) {
        return Jwts.builder()
            .setSubject(email)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateToken(String token) {
        if (!hasCanonicalSignature(token)) {
            return false;
        }
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Rejects signatures whose base64url encoding has non-zero padding bits.
     * Such a string decodes to the same bytes as the legitimate signature, so
     * changing only the last character could otherwise still be accepted.
     */
    private static boolean hasCanonicalSignature(String token) {
        if (token == null) {
            return false;
        }
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3 || parts[2].isEmpty()) {
            return false;
        }
        try {
            byte[] signature = Base64.getUrlDecoder().decode(parts[2]);
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(signature).equals(parts[2]);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
