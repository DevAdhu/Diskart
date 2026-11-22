package com.store.ecommerce.service;

import com.store.ecommerce.dto.ReviewDto;
import com.store.ecommerce.dto.ReviewRequest;
import com.store.ecommerce.dto.ReviewSummaryDto;
import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.Review;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductService productService;
    private final UserService userService;

    /** Public: does not require an authenticated user. */
    public ReviewSummaryDto getReviews(Long productId) {
        productService.getProductById(productId);
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);

        ReviewSummaryDto summary = new ReviewSummaryDto();
        Double average = reviewRepository.findAverageRatingByProductId(productId);
        summary.setAverageRating(average == null
                ? null
                : Math.round(average * 100.0) / 100.0);
        summary.setTotalReviews(reviewRepository.countByProductId(productId));
        summary.setReviews(reviews.stream().map(DtoMapper::toReviewDto).toList());
        return summary;
    }

    /** One review per user per product; an existing review is updated in place. */
    @Transactional
    public Review upsertReview(Long productId, ReviewRequest request) {
        User current = userService.getCurrentUser();
        Product product = productService.getProductById(productId);

        Review review = reviewRepository.findByUserIdAndProductId(current.getId(), productId)
                .orElse(null);
        if (review == null) {
            review = new Review();
            review.setUser(current);
            review.setProduct(product);
        }
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        return reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(Long productId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));
        if (review.getProduct() == null || review.getProduct().getId() == null
                || !review.getProduct().getId().equals(productId)) {
            throw new ResourceNotFoundException("Review not found: " + reviewId);
        }

        User current = userService.getCurrentUser();
        boolean owner = review.getUser() != null
                && review.getUser().getId() != null
                && review.getUser().getId().equals(current.getId());
        if (current.getRole() != User.Role.ADMIN && !owner) {
            throw new AccessDeniedException("You are not allowed to delete this review");
        }
        reviewRepository.delete(review);
    }
}
