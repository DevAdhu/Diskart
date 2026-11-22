package com.store.ecommerce.dto;

import lombok.Data;

import java.util.List;

/** Shape returned by GET /api/products/{id}/reviews. */
@Data
public class ReviewSummaryDto {
    private Double averageRating;
    private long totalReviews;
    private List<ReviewDto> reviews;
}
