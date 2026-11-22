package com.store.ecommerce.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/** Step 3 of checkout: record a failed payment and release reserved stock. */
@Data
public class RazorpayFailureRequest {

    @NotNull(message = "orderId is required")
    @Positive(message = "orderId must be positive")
    private Long orderId;

    private String razorpayOrderId;

    private String reason;
}
