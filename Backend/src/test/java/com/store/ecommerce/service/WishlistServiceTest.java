package com.store.ecommerce.service;

import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.User;
import com.store.ecommerce.model.Wishlist;
import com.store.ecommerce.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WishlistServiceTest {

    @Mock
    private WishlistRepository wishlistRepository;
    @Mock
    private ProductService productService;
    @Mock
    private UserService userService;

    private WishlistService wishlistService;

    @BeforeEach
    void setUp() {
        wishlistService = new WishlistService(wishlistRepository, productService, userService);
    }

    private static User user() {
        User user = new User();
        user.setId(7L);
        user.setEmail("buyer@example.com");
        user.setRole(User.Role.CUSTOMER);
        return user;
    }

    private static Product product(Long id) {
        Product product = new Product();
        product.setId(id);
        product.setName("Product " + id);
        product.setAverageRating(4.0);
        product.setReviewCount(2L);
        return product;
    }

    private static Wishlist entry(User user, Product product) {
        Wishlist entry = new Wishlist();
        entry.setUser(user);
        entry.setProduct(product);
        return entry;
    }

    @Test
    void addingAProductUsesJwtUserAndIsIdempotent() {
        User user = user();
        Product product = product(1L);
        when(userService.getCurrentUser()).thenReturn(user);
        when(productService.getProductById(1L)).thenReturn(product);
        when(wishlistRepository.existsByUserIdAndProductId(7L, 1L)).thenReturn(false);
        when(wishlistRepository.findByUserIdOrderByAddedAtDesc(7L))
                .thenReturn(List.of(entry(user, product)));

        List<Product> result = wishlistService.addToWishlist(1L);

        assertThat(result).extracting(Product::getId).containsExactly(1L);
        assertThat(result.get(0).getAverageRating()).isEqualTo(4.0);
        verify(wishlistRepository).save(any(Wishlist.class));
    }

    @Test
    void addingAnAlreadyWishlistedProductDoesNotInsertAgain() {
        User user = user();
        Product product = product(1L);
        when(userService.getCurrentUser()).thenReturn(user);
        when(productService.getProductById(1L)).thenReturn(product);
        when(wishlistRepository.existsByUserIdAndProductId(7L, 1L)).thenReturn(true);
        when(wishlistRepository.findByUserIdOrderByAddedAtDesc(7L))
                .thenReturn(List.of(entry(user, product)));

        List<Product> result = wishlistService.addToWishlist(1L);

        assertThat(result).hasSize(1);
        verify(wishlistRepository, never()).save(any(Wishlist.class));
    }

    @Test
    void removingAProductDeletesOnlyTheCurrentUsersEntry() {
        User user = user();
        Wishlist existing = entry(user, product(2L));
        when(userService.getCurrentUser()).thenReturn(user);
        when(wishlistRepository.findByUserIdAndProductId(7L, 2L))
                .thenReturn(Optional.of(existing));
        when(wishlistRepository.findByUserIdOrderByAddedAtDesc(7L)).thenReturn(List.of());

        List<Product> result = wishlistService.removeFromWishlist(2L);

        assertThat(result).isEmpty();
        verify(wishlistRepository).delete(existing);
    }
}
