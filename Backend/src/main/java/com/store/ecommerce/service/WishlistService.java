package com.store.ecommerce.service;

import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.User;
import com.store.ecommerce.model.Wishlist;
import com.store.ecommerce.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductService productService;
    private final UserService userService;

    /** The user is always derived from the JWT-backed security context. */
    @Transactional(readOnly = true)
    public List<Product> getWishlist() {
        User user = userService.getCurrentUser();
        return wishlistRepository.findByUserIdOrderByAddedAtDesc(user.getId()).stream()
                .map(entry -> productService.getProductById(entry.getProduct().getId()))
                .toList();
    }

    /** Adding the same product twice is a no-op. */
    @Transactional
    public List<Product> addToWishlist(Long productId) {
        User user = userService.getCurrentUser();
        Product product = productService.getProductById(productId);
        if (!wishlistRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            Wishlist entry = new Wishlist();
            entry.setUser(user);
            entry.setProduct(product);
            wishlistRepository.save(entry);
        }
        return getWishlist();
    }

    /** Removing a product that is not wishlisted is a no-op. */
    @Transactional
    public List<Product> removeFromWishlist(Long productId) {
        User user = userService.getCurrentUser();
        wishlistRepository.findByUserIdAndProductId(user.getId(), productId)
                .ifPresent(wishlistRepository::delete);
        return getWishlist();
    }
}
