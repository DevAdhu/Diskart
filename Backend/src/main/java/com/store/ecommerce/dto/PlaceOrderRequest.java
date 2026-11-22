package com.store.ecommerce.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

/**
 * Request body for placing an order. The user is never supplied by the client;
 * it is derived from the authenticated JWT principal.
 */
@Data
public class PlaceOrderRequest {

    @NotEmpty(message = "productIds must not be empty")
    private List<@NotNull @Positive(message = "productIds must contain positive values") Long> productIds;

    @NotEmpty(message = "quantities must not be empty")
    private List<@NotNull @Positive(message = "quantities must contain positive values") Integer> quantities;
}
