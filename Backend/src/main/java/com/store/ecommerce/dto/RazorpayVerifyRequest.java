package com.store.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/** Step 2 of checkout: server-side signature verification. */
@Data
public class RazorpayVerifyRequest {

    @NotNull(message = "orderId is required")
    @Positive(message = "orderId must be positive")
    private Long orderId;

    @NotBlank(message = "razorpayOrderId is required")
    private String razorpayOrderId;

    @NotBlank(message = "razorpayPaymentId is required")
    private String razorpayPaymentId;

    @NotBlank(message = "razorpaySignature is required")
    private String razorpaySignature;
}
