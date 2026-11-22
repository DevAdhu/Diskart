package com.store.ecommerce.service;

import com.store.ecommerce.model.Product;
import com.store.ecommerce.repository.OrderItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductService productService;

    private RecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationService(orderItemRepository, productService);
    }

    private static Product product(Long id, String category, int stock, Double rating) {
        Product product = new Product();
        product.setId(id);
        product.setName("Product " + id);
        product.setPrice(new BigDecimal("10.00"));
        product.setCategory(category);
        product.setStock(stock);
        product.setAverageRating(rating);
        return product;
    }

    @Test
    void coPurchasedProductsComeFirstAndExcludeSelfAndSoldOutItems() {
        Product source = product(1L, "electronics", 5, 4.0);
        Product caseProduct = product(2L, "accessories", 3, 3.0);
        Product soldOut = product(3L, "accessories", 0, 5.0);
        Product charger = product(4L, "accessories", 2, 2.0);

        when(productService.getProductById(1L)).thenReturn(source);
        when(orderItemRepository.findCoPurchasedProductIds(1L))
                .thenReturn(List.of(2L, 3L, 1L, 4L));
        when(productService.getProductById(2L)).thenReturn(caseProduct);
        when(productService.getProductById(3L)).thenReturn(soldOut);
        when(productService.getProductById(4L)).thenReturn(charger);

        List<Product> result = recommendationService.getRecommendations(1L, 6);

        assertThat(result).extracting(Product::getId).containsExactly(2L, 4L);
    }

    @Test
    void fallsBackToSameCategoryProductsWhenNoCoPurchaseData() {
        Product source = product(1L, "electronics", 5, 4.0);
        Product inStock = product(2L, "electronics", 4, 3.0);
        Product soldOut = product(3L, "electronics", 0, 5.0);

        when(productService.getProductById(1L)).thenReturn(source);
        when(orderItemRepository.findCoPurchasedProductIds(1L)).thenReturn(List.of());
        when(productService.getProductsByCategory("electronics"))
                .thenReturn(List.of(source, inStock, soldOut));

        List<Product> result = recommendationService.getRecommendations(1L, 6);

        assertThat(result).extracting(Product::getId).containsExactly(2L);
    }

    @Test
    void fallsBackToHighestRatedProductsAndNeverReturnsEmptyWithAlternatives() {
        Product source = product(1L, "electronics", 5, 4.0);
        Product topRated = product(2L, "books", 5, 5.0);
        Product lowerRated = product(3L, "books", 5, 2.5);

        when(productService.getProductById(1L)).thenReturn(source);
        when(orderItemRepository.findCoPurchasedProductIds(1L)).thenReturn(List.of());
        when(productService.getAllProducts()).thenReturn(List.of(source, lowerRated, topRated));

        List<Product> result = recommendationService.getRecommendations(1L, 6);

        assertThat(result).extracting(Product::getId).containsExactly(2L, 3L);
    }

    @Test
    void includesSoldOutAlternativesAsLastResort() {
        Product source = product(1L, "electronics", 5, 4.0);
        Product soldOutOnlyAlternative = product(2L, "books", 0, 5.0);

        when(productService.getProductById(1L)).thenReturn(source);
        when(orderItemRepository.findCoPurchasedProductIds(1L)).thenReturn(List.of());
        when(productService.getAllProducts()).thenReturn(List.of(source, soldOutOnlyAlternative));

        List<Product> result = recommendationService.getRecommendations(1L, 6);

        assertThat(result).extracting(Product::getId).containsExactly(2L);
    }

    @Test
    void limitIsCappedAtTwenty() {
        Product source = product(1L, "electronics", 5, 4.0);
        List<Product> catalogue = new java.util.ArrayList<>();
        catalogue.add(source);
        for (long id = 2; id <= 30; id++) {
            catalogue.add(product(id, "books", 5, 3.0));
        }

        when(productService.getProductById(1L)).thenReturn(source);
        when(orderItemRepository.findCoPurchasedProductIds(1L)).thenReturn(List.of());
        when(productService.getAllProducts()).thenReturn(catalogue);

        List<Product> result = recommendationService.getRecommendations(1L, 100);

        assertThat(result).hasSize(20);
        assertThat(result).doesNotContain(source);
    }
}
