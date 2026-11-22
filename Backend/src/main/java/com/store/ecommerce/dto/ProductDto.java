package com.store.ecommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductDto {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String category;
    private String imageUrl;
    private List<String> images;

    /* Optional richer details. */
    private String brand;
    private String sku;
    private String warranty;
    private String specifications;

    /** Null when the product has no reviews yet. */
    private Double averageRating;
    private long reviewCount;
}
