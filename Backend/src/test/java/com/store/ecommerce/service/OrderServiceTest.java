package com.store.ecommerce.service;

import com.store.ecommerce.exception.BadRequestException;
import com.store.ecommerce.model.Address;
import com.store.ecommerce.exception.ConflictException;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.OrderRepository;
import com.store.ecommerce.repository.ProductRepository;
import com.store.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
        orderService = new OrderService(orderRepository, productRepository, userService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String email) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(email, "password",
                        List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private static User user(Long id, String email, User.Role role) {
        User user = new User();
        user.setId(id);
        user.setName("Buyer");
        user.setEmail(email);
        user.setRole(role);
        return user;
    }

    private static Product product(Long id, String name, String price, int stock) {
        Product product = new Product();
        product.setId(id);
        product.setName(name);
        product.setPrice(new BigDecimal(price));
        product.setStock(stock);
        return product;
    }

    @Test
    void resolvesUserFromSecurityContextAndPlacesOrder() {
        User buyer = user(7L, "buyer@example.com", User.Role.CUSTOMER);
        authenticate("buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(buyer));
        Product product = product(1L, "Shoe", "10.00", 5);
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(product));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            saved.setId(100L);
            return saved;
        });

        Order result = orderService.placeOrder(List.of(1L), List.of(2));

        assertThat(result.getUser()).isSameAs(buyer);
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.PENDING);
        assertThat(result.getSubtotal()).isEqualByComparingTo("20.00");
        assertThat(result.getTax()).isEqualByComparingTo("3.60");
        assertThat(result.getShippingFee()).isEqualByComparingTo("40");
        // Final payable = subtotal + tax + shippingFee.
        assertThat(result.getTotalAmount()).isEqualByComparingTo("63.60");
        assertThat(product.getStock()).isEqualTo(3);
        verify(productRepository).findByIdForUpdate(1L);
        verify(productRepository).save(product);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    void freeShippingForLargeCartAndAddressSnapshot() {
        User buyer = user(7L, "buyer@example.com", User.Role.CUSTOMER);
        authenticate("buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(buyer));
        when(productRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(product(1L, "Shoe", "300.00", 5)));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            saved.setId(101L);
            return saved;
        });

        Address address = new Address();
        address.setLine1("1 Main St");
        address.setCity("Delhi");
        address.setPostalCode("110001");
        address.setCountry("India");

        Order result = orderService.createPendingOrder(address, List.of(1L), List.of(2));

        assertThat(result.getSubtotal()).isEqualByComparingTo("600.00");
        assertThat(result.getTax()).isEqualByComparingTo("108.00");
        assertThat(result.getShippingFee()).isEqualByComparingTo("0");
        assertThat(result.getTotalAmount()).isEqualByComparingTo("708.00");
        assertThat(result.getRecipientName()).isEqualTo("Buyer");
        assertThat(result.getAddressLine1()).isEqualTo("1 Main St");
        assertThat(result.getCity()).isEqualTo("Delhi");
    }

    @Test
    void insufficientStockThrowsConflictAndSavesNothing() {
        authenticate("buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com"))
                .thenReturn(Optional.of(user(7L, "buyer@example.com", User.Role.CUSTOMER)));
        when(productRepository.findByIdForUpdate(1L))
                .thenReturn(Optional.of(product(1L, "Shoe", "10.00", 1)));

        assertThatThrownBy(() -> orderService.placeOrder(List.of(1L), List.of(2)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Insufficient stock");

        verify(orderRepository, never()).save(any(Order.class));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void mismatchedProductIdsAndQuantitiesAreRejectedBeforeAnyLookup() {
        assertThatThrownBy(() -> orderService.placeOrder(List.of(1L), List.of(1, 2)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("same size");

        verifyNoInteractions(productRepository, orderRepository, userRepository);
    }

    @Test
    void placingOrderWithoutAuthenticationIsRejected() {
        assertThatThrownBy(() -> orderService.placeOrder(List.of(1L), List.of(1)))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);

        verifyNoInteractions(productRepository, orderRepository);
    }

    @Test
    void readingAnOrderIsLimitedToOwnerOrAdmin() {
        User owner = user(7L, "owner@example.com", User.Role.CUSTOMER);
        User stranger = user(8L, "stranger@example.com", User.Role.CUSTOMER);
        Order order = new Order();
        order.setId(55L);
        order.setUser(owner);
        when(orderRepository.findById(55L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(userRepository.findByEmail("stranger@example.com")).thenReturn(Optional.of(stranger));

        authenticate("owner@example.com");
        assertThat(orderService.getOrderByIdForCurrentUser(55L)).isSameAs(order);

        authenticate("stranger@example.com");
        assertThatThrownBy(() -> orderService.getOrderByIdForCurrentUser(55L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);

        authenticate("admin@example.com");
        when(userRepository.findByEmail("admin@example.com"))
                .thenReturn(Optional.of(user(9L, "admin@example.com", User.Role.ADMIN)));
        assertThat(orderService.getOrderByIdForCurrentUser(55L)).isSameAs(order);
    }
}
