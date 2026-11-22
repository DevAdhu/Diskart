package com.store.ecommerce.service;

import com.store.ecommerce.exception.ConflictException;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.model.OrderItem;
import com.store.ecommerce.model.OrderStatusHistory;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.OrderRepository;
import com.store.ecommerce.repository.OrderStatusHistoryRepository;
import com.store.ecommerce.repository.ProductRepository;
import com.store.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderCancellationTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private OrderStatusHistoryRepository historyRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        UserService userService = new UserService(userRepository, passwordEncoder);
        OrderStatusHistoryService historyService =
                new OrderStatusHistoryService(historyRepository);
        orderService = new OrderService(
                orderRepository, productRepository, userService, historyService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private static void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "password",
                        List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));
    }

    private static User user(Long id, String email, User.Role role) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName("Buyer");
        user.setRole(role);
        return user;
    }

    private static Order order(Order.OrderStatus status, User owner) {
        Product product = new Product();
        product.setId(1L);
        product.setName("Shoe");
        product.setStock(3);

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(2);
        item.setPrice(new BigDecimal("10.00"));

        Order order = new Order();
        order.setId(55L);
        order.setUser(owner);
        order.setStatus(status);
        order.setItems(new java.util.ArrayList<>(List.of(item)));
        return order;
    }

    @Test
    void ownerCanCancelPendingOrderRestoresStockAndRecordsHistory() {
        User owner = user(7L, "owner@example.com", User.Role.CUSTOMER);
        Order order = order(Order.OrderStatus.PENDING, owner);
        authenticate("owner@example.com");
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(orderRepository.findById(55L)).thenReturn(Optional.of(order));
        Product product = order.getItems().get(0).getProduct();
        when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(product));
        when(orderRepository.save(order)).thenReturn(order);

        Order result = orderService.cancelOrder(55L);

        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.CANCELLED);
        assertThat(product.getStock()).isEqualTo(5);
        ArgumentCaptor<OrderStatusHistory> captor =
                ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(historyRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(Order.OrderStatus.CANCELLED);
        assertThat(captor.getValue().getNote()).isEqualTo("Cancelled by customer");
        assertThat(captor.getValue().getChangedAt()).isNotNull();
    }

    @Test
    void nonOwnerCannotCancelOrder() {
        User owner = user(7L, "owner@example.com", User.Role.CUSTOMER);
        User stranger = user(8L, "stranger@example.com", User.Role.CUSTOMER);
        Order order = order(Order.OrderStatus.PENDING, owner);
        authenticate("stranger@example.com");
        when(userRepository.findByEmail("stranger@example.com")).thenReturn(Optional.of(stranger));
        when(orderRepository.findById(55L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(55L))
                .isInstanceOf(AccessDeniedException.class);

        verify(productRepository, never()).findByIdForUpdate(any());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void shippedOrderCannotBeCancelled() {
        User owner = user(7L, "owner@example.com", User.Role.CUSTOMER);
        Order order = order(Order.OrderStatus.SHIPPED, owner);
        authenticate("owner@example.com");
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(orderRepository.findById(55L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder(55L))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("cannot be cancelled");

        verify(orderRepository, never()).save(any(Order.class));
        verify(historyRepository, never()).save(any());
    }

    @Test
    void adminStatusPatchRecordsHistory() {
        Order order = order(Order.OrderStatus.PENDING,
                user(7L, "owner@example.com", User.Role.CUSTOMER));
        authenticate("admin@example.com");
        when(orderRepository.findById(55L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        Order result = orderService.updateStatus(55L, Order.OrderStatus.SHIPPED);

        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.SHIPPED);
        ArgumentCaptor<OrderStatusHistory> captor =
                ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(historyRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(Order.OrderStatus.SHIPPED);
        assertThat(captor.getValue().getNote()).isEqualTo("Status updated by admin");
    }

    @Test
    void historyIsLimitedToOwnerOrAdmin() {
        User owner = user(7L, "owner@example.com", User.Role.CUSTOMER);
        User stranger = user(8L, "stranger@example.com", User.Role.CUSTOMER);
        User admin = user(9L, "admin@example.com", User.Role.ADMIN);
        Order order = order(Order.OrderStatus.CONFIRMED, owner);
        OrderStatusHistory first = new OrderStatusHistory();
        first.setStatus(Order.OrderStatus.PENDING);
        OrderStatusHistory second = new OrderStatusHistory();
        second.setStatus(Order.OrderStatus.CONFIRMED);
        when(orderRepository.findById(55L)).thenReturn(Optional.of(order));
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(userRepository.findByEmail("stranger@example.com")).thenReturn(Optional.of(stranger));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(historyRepository.findByOrderIdOrderByChangedAtAsc(55L))
                .thenReturn(List.of(first, second));

        authenticate("owner@example.com");
        assertThat(orderService.getHistory(55L)).containsExactly(first, second);

        authenticate("admin@example.com");
        assertThat(orderService.getHistory(55L)).containsExactly(first, second);

        authenticate("stranger@example.com");
        assertThatThrownBy(() -> orderService.getHistory(55L))
                .isInstanceOf(AccessDeniedException.class);
    }
}
