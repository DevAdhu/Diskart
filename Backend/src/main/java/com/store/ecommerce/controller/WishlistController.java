package com.store.ecommerce.controller;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.ProductDto;
import com.store.ecommerce.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /** Returns the current user's wishlisted products; the user comes from the JWT. */
    @GetMapping
    public List<ProductDto> getWishlist() {
        return wishlistService.getWishlist().stream()
                .map(DtoMapper::toProductDto)
                .toList();
    }

    @PostMapping("/{productId}")
    public List<ProductDto> addToWishlist(@PathVariable Long productId) {
        return wishlistService.addToWishlist(productId).stream()
                .map(DtoMapper::toProductDto)
                .toList();
    }

    @DeleteMapping("/{productId}")
    public List<ProductDto> removeFromWishlist(@PathVariable Long productId) {
        return wishlistService.removeFromWishlist(productId).stream()
                .map(DtoMapper::toProductDto)
                .toList();
    }
}
