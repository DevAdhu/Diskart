package com.store.ecommerce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.store.ecommerce.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

/**
 * Thin Razorpay integration built on the JDK HTTP client — no third-party SDK.
 * The key secret is only ever used for Basic auth and HMAC signing; it is never
 * logged or returned to callers.
 */
@Service
public class RazorpayService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final String keyId;
    private final String keySecret;
    private final String apiUrl;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Autowired
    public RazorpayService(@Value("${razorpay.key.id}") String keyId,
                           @Value("${razorpay.key.secret}") String keySecret,
                           @Value("${razorpay.api.url}") String apiUrl) {
        this(keyId, keySecret, apiUrl, new ObjectMapper(), HttpClient.newHttpClient());
    }

    /** Package-visible constructor so tests can inject a known secret / fake HTTP client. */
    RazorpayService(String keyId, String keySecret, String apiUrl,
                    ObjectMapper objectMapper, HttpClient httpClient) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.apiUrl = apiUrl;
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    public String getKeyId() {
        return keyId;
    }

    /**
     * Demo mode is active when the key id is missing or still the shipped
     * placeholder. The frontend skips the Razorpay checkout in this case and
     * posts dummy verification values, which the backend must accept.
     */
    public boolean isDemoMode() {
        return keyId == null || keyId.isBlank() || keyId.startsWith("rzp_test_your");
    }

    /** Generates a local order id for demo mode (no external HTTP call). */
    public String createDemoOrderId(Long orderId) {
        return "demo_order_" + orderId + "_" + java.util.UUID.randomUUID()
                .toString().replace("-", "");
    }

    /** Creates a Razorpay order and returns its provider order id. */
    public String createOrder(long amountPaise, String receipt) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "amount", amountPaise,
                    "currency", "INR",
                    "receipt", receipt));
        } catch (IOException ex) {
            throw new BadRequestException("Unable to build Razorpay order request", ex);
        }

        String basic = Base64.getEncoder().encodeToString(
                (keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder(URI.create(apiUrl + "/orders"))
                .header("Authorization", "Basic " + basic)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Razorpay order creation was interrupted", ex);
        } catch (IOException ex) {
            throw new BadRequestException("Razorpay order creation failed", ex);
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            // Do not log the response body: it may echo request details.
            throw new BadRequestException(
                    "Razorpay order creation failed with status " + response.statusCode());
        }

        try {
            JsonNode node = objectMapper.readTree(response.body());
            String id = node.path("id").asText(null);
            if (id == null || id.isBlank()) {
                throw new BadRequestException("Razorpay did not return an order id");
            }
            return id;
        } catch (IOException ex) {
            throw new BadRequestException("Unable to parse Razorpay order response", ex);
        }
    }

    /** Lower-case hex HMAC-SHA256 of {@code data} using the configured key secret. */
    public String computeSignature(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to compute Razorpay signature", ex);
        }
    }

    /**
     * Verifies the Razorpay webhook/checkout signature. The comparison is
     * constant-time to avoid leaking the expected signature via timing.
     *
     * @throws BadRequestException when any input is missing or the signature does not match
     */
    public void verifySignature(String razorpayOrderId, String razorpayPaymentId,
                                String signature) {
        if (razorpayOrderId == null || razorpayOrderId.isBlank()
                || razorpayPaymentId == null || razorpayPaymentId.isBlank()
                || signature == null || signature.isBlank()) {
            throw new BadRequestException("Invalid Razorpay payment verification data");
        }
        String expected = computeSignature(razorpayOrderId + "|" + razorpayPaymentId);
        boolean matches = MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8));
        if (!matches) {
            throw new BadRequestException("Razorpay signature verification failed");
        }
    }
}
