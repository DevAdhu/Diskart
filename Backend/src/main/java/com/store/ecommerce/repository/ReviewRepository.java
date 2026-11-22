package com.store.ecommerce.repository;

import com.store.ecommerce.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    Optional<Review> findByUserIdAndProductId(Long userId, Long productId);

    long countByProductId(Long productId);

    /** Returns null when the product has no reviews yet. */
    @Query("select avg(r.rating) from Review r where r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);
}
