package com.store.ecommerce.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

/** Step 1 of checkout. The user is derived from the JWT, never from the body. */
@Data
public class RazorpayOrderRequest {

    @NotNull(message = "addressId is required")
    @Positive(message = "addressId must be positive")
    private Long addressId;

    @NotEmpty(message = "productIds must not be empty")
    private List<@NotNull @Positive(message = "productIds must contain positive values") Long> productIds;

    @NotEmpty(message = "quantities must not be empty")
    private List<@NotNull @Positive(message = "quantities must contain positive values") Integer> quantities;
}
