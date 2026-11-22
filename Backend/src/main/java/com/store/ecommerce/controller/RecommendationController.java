package com.store.ecommerce.controller;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.ProductDto;
import com.store.ecommerce.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    /** Public, like the other product GET endpoints. */
    @GetMapping("/{id}/recommendations")
    public List<ProductDto> getRecommendations(
            @PathVariable Long id,
            @RequestParam(defaultValue = "6") int limit) {
        return recommendationService.getRecommendations(id, limit).stream()
                .map(DtoMapper::toProductDto)
                .toList();
    }
}
