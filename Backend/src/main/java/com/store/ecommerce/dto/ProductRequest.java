package com.store.ecommerce.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Validated request body for creating/updating a product. Replaces the previous
 * practice of binding the JPA {@code Product} entity directly to requests.
 */
@Data
public class ProductRequest {

    @NotBlank(message = "name is required")
    @Size(max = 200, message = "name must be at most 200 characters")
    private String name;

    @Size(max = 2000, message = "description must be at most 2000 characters")
    private String description;

    @NotNull(message = "price is required")
    @DecimalMin(value = "0.01", message = "price must be at least 0.01")
    private BigDecimal price;

    @NotNull(message = "stock is required")
    @Min(value = 0, message = "stock must not be negative")
    private Integer stock;

    @Size(max = 500, message = "imageUrl must be at most 500 characters")
    private String imageUrl;

    @NotBlank(message = "category is required")
    @Size(max = 100, message = "category must be at most 100 characters")
    private String category;
}
