package com.store.ecommerce.controller;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.ReviewDto;
import com.store.ecommerce.dto.ReviewRequest;
import com.store.ecommerce.dto.ReviewSummaryDto;
import com.store.ecommerce.model.Review;
import com.store.ecommerce.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** Public, like other product GETs. */
    @GetMapping("/{id}/reviews")
    public ReviewSummaryDto getReviews(@PathVariable Long id) {
        return reviewService.getReviews(id);
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<ReviewDto> upsertReview(@PathVariable Long id,
                                                  @Valid @RequestBody ReviewRequest request) {
        Review review = reviewService.upsertReview(id, request);
        return ResponseEntity.ok(DtoMapper.toReviewDto(review));
    }

    @DeleteMapping("/{id}/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id,
                                             @PathVariable Long reviewId) {
        reviewService.deleteReview(id, reviewId);
        return ResponseEntity.noContent().build();
    }
}
