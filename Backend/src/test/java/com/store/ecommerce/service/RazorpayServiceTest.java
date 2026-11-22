package com.store.ecommerce.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.store.ecommerce.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RazorpayServiceTest {

    private static RazorpayService serviceWithKey(String keyId) {
        return new RazorpayService(keyId, "test_secret", "https://api.razorpay.com/v1",
                new ObjectMapper(), HttpClient.newHttpClient());
    }

    @Test
    void computesHmacSha256Hex() {
        // Known-answer vector for secret "test_secret" and "order_1|pay_1".
        assertThat(serviceWithKey("rzp_test_real").computeSignature("order_1|pay_1"))
                .isEqualTo("444ab3353f39d9a6cd042ce01e598f3a2819f46159b58f0ff40d4eed15d8e158");
    }

    @Test
    void acceptsValidSignature() {
        RazorpayService service = serviceWithKey("rzp_test_real");
        String signature = service.computeSignature("order_1|pay_1");

        assertThatCode(() -> service.verifySignature("order_1", "pay_1", signature))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsWrongSignature() {
        RazorpayService service = serviceWithKey("rzp_test_real");
        assertThatThrownBy(() -> service.verifySignature("order_1", "pay_1", "deadbeef"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("verification failed");
    }

    @Test
    void rejectsSignatureForDifferentPaymentId() {
        RazorpayService service = serviceWithKey("rzp_test_real");
        String signature = service.computeSignature("order_1|pay_1");
        assertThatThrownBy(() -> service.verifySignature("order_1", "pay_2", signature))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsBlankOrMissingInputs() {
        RazorpayService service = serviceWithKey("rzp_test_real");
        assertThatThrownBy(() -> service.verifySignature(null, "pay_1", "sig"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.verifySignature("order_1", "", "sig"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.verifySignature("order_1", "pay_1", null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void detectsDemoModeFromPlaceholderOrMissingKey() {
        assertThat(serviceWithKey("rzp_test_your_key_id").isDemoMode()).isTrue();
        assertThat(serviceWithKey(null).isDemoMode()).isTrue();
        assertThat(serviceWithKey("").isDemoMode()).isTrue();
        assertThat(serviceWithKey("rzp_test_real_key").isDemoMode()).isFalse();
    }
}
