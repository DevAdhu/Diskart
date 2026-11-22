package com.store.ecommerce.service;

import com.store.ecommerce.dto.PagedResponse;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.repository.ProductImageRepository;
import com.store.ecommerce.repository.ProductRepository;
import com.store.ecommerce.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductFilterServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductImageRepository productImageRepository;
    @Mock
    private ReviewRepository reviewRepository;

    private ProductService productService;

    @BeforeEach
    void setUp() {
        productService = new ProductService(
                productRepository, productImageRepository, reviewRepository);
    }

    private static Product product(Long id) {
        Product product = new Product();
        product.setId(id);
        product.setName("Shoe " + id);
        return product;
    }

    @Test
    void brandsAreDistinctNonNullAndSorted() {
        when(productRepository.findDistinctBrands())
                .thenReturn(java.util.Arrays.asList("Nike", null, "  ", "Adidas", "Nike"));

        assertThat(productService.getBrands()).containsExactly("Adidas", "Nike");
    }

    @Test
    void suggestionsCappedAtTwentyAndPopulateReviewStats() {
        Product product = product(1L);
        when(productRepository.findByNameContainingIgnoreCaseOrderByNameAsc(
                eq("Shoe"), any(Pageable.class))).thenReturn(List.of(product));
        when(reviewRepository.findAverageRatingByProductId(1L)).thenReturn(4.5);
        when(reviewRepository.countByProductId(1L)).thenReturn(3L);

        List<Product> result = productService.getSuggestions("  Shoe  ", 50);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAverageRating()).isEqualTo(4.5);
        assertThat(result.get(0).getReviewCount()).isEqualTo(3L);
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).findByNameContainingIgnoreCaseOrderByNameAsc(
                eq("Shoe"), pageable.capture());
        assertThat(pageable.getValue().getPageSize()).isEqualTo(20);
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(productService.getSuggestions("  ", 8)).isEmpty();
    }

    @Test
    void minRatingWithNoMatchesReturnsEmptyPageWithoutQueryingProducts() {
        when(reviewRepository.findProductIdsWithAverageRatingAtLeast(4.0))
                .thenReturn(List.of());

        PagedResponse<Product> result = productService.getProductsPaged(
                0, 12, "name,asc", null, null, null, null, null, 4.0);

        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isZero();
        assertThat(result.totalPages()).isZero();
        verify(productRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void allFiltersAreCombinedIntoOneSpecificationAndStatsArePopulated() {
        when(reviewRepository.findProductIdsWithAverageRatingAtLeast(4.0))
                .thenReturn(List.of(1L, 2L));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product(1L))));
        when(reviewRepository.findAverageRatingByProductId(1L)).thenReturn(4.2);
        when(reviewRepository.countByProductId(1L)).thenReturn(5L);

        PagedResponse<Product> result = productService.getProductsPaged(
                0, 5, "price,desc", "shoe", "footwear",
                new BigDecimal("10"), new BigDecimal("500"),
                List.of("Nike", "Adidas"), 4.0);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).getAverageRating()).isEqualTo(4.2);
        assertThat(result.content().get(0).getReviewCount()).isEqualTo(5L);
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(productRepository).findAll(any(Specification.class), pageable.capture());
        assertThat(pageable.getValue().getPageSize()).isEqualTo(5);
        assertThat(pageable.getValue().getSort().getOrderFor("price").getDirection().isDescending())
                .isTrue();
    }

    @Test
    void legacyFiveArgumentOverloadStillWorks() {
        when(productRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        PagedResponse<Product> result = productService.getProductsPaged(
                0, 12, "name,asc", null, null);

        assertThat(result.content()).isEmpty();
        verify(reviewRepository, never())
                .findProductIdsWithAverageRatingAtLeast(anyDouble());
    }
}
