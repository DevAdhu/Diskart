package com.store.ecommerce.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private static final String SECRET = "unit-test-secret-key-at-least-32-bytes-long";

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiration", 60_000L);
    }

    @Test
    void generatedTokenIsValidAndContainsEmail() {
        String token = jwtUtil.generateToken("buyer@example.com");

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.validateToken(token)).isTrue();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("buyer@example.com");
    }

    @Test
    void tamperedTokenIsRejected() {
        String token = jwtUtil.generateToken("buyer@example.com");
        String tampered = token.substring(0, token.length() - 1)
                + (token.endsWith("a") ? "b" : "a");

        assertThat(jwtUtil.validateToken(tampered)).isFalse();
    }

    @Test
    void garbageTokenIsRejected() {
        assertThat(jwtUtil.validateToken("not-a-jwt")).isFalse();
        assertThat(jwtUtil.validateToken("")).isFalse();
    }
}
