package com.store.ecommerce.service;

import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * "Frequently bought together" recommendations derived from order-item
 * co-occurrence, with category and highest-rated fallbacks so the section is
 * never empty while the catalogue still has alternatives.
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final int MAX_LIMIT = 20;

    private final OrderItemRepository orderItemRepository;
    private final ProductService productService;

    public List<Product> getRecommendations(Long productId, int limit) {
        Product source = productService.getProductById(productId);
        int cap = Math.min(Math.max(limit, 1), MAX_LIMIT);

        Set<Long> seen = new LinkedHashSet<>();
        seen.add(productId);
        List<Product> result = new ArrayList<>();

        // 1. Products bought together with this one, most frequent first.
        for (Long id : orderItemRepository.findCoPurchasedProductIds(productId)) {
            if (result.size() >= cap) {
                break;
            }
            if (id == null || seen.contains(id)) {
                continue;
            }
            Product candidate = findProduct(id);
            if (candidate != null) {
                addCandidate(result, seen, candidate, cap, true);
            }
        }

        // 2. Fall back to other products in the same category.
        if (source.getCategory() != null && !source.getCategory().isBlank()) {
            for (Product candidate : productService.getProductsByCategory(source.getCategory())) {
                if (result.size() >= cap) {
                    break;
                }
                addCandidate(result, seen, candidate, cap, true);
            }
        }

        // 3. Fall back to the highest rated products in the catalogue.
        List<Product> byRating = productService.getAllProducts().stream()
                .sorted(Comparator.comparing(Product::getAverageRating,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        for (Product candidate : byRating) {
            if (result.size() >= cap) {
                break;
            }
            addCandidate(result, seen, candidate, cap, true);
        }

        // 4. Last resort: include sold-out alternatives rather than show nothing.
        for (Product candidate : byRating) {
            if (result.size() >= cap) {
                break;
            }
            addCandidate(result, seen, candidate, cap, false);
        }
        return result;
    }

    private Product findProduct(Long id) {
        try {
            return productService.getProductById(id);
        } catch (ResourceNotFoundException ex) {
            return null;
        }
    }

    private static void addCandidate(List<Product> result, Set<Long> seen,
                                     Product candidate, int cap, boolean requireStock) {
        if (candidate == null || candidate.getId() == null || seen.contains(candidate.getId())) {
            return;
        }
        if (result.size() >= cap) {
            return;
        }
        if (requireStock && candidate.getStock() != null && candidate.getStock() <= 0) {
            return;
        }
        result.add(candidate);
        seen.add(candidate.getId());
    }
}
