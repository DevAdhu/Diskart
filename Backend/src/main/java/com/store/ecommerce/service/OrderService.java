package com.store.ecommerce.service;

import com.store.ecommerce.exception.BadRequestException;
import com.store.ecommerce.exception.ConflictException;
import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.model.OrderItem;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.OrderRepository;
import com.store.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    /**
     * Places an order for the authenticated user. Products are locked with a
     * pessimistic write lock while stock is checked and decremented, so two
     * concurrent orders cannot oversell the same product.
     */
    @Transactional
    public Order placeOrder(List<Long> productIds, List<Integer> quantities) {
        if (productIds == null || quantities == null || productIds.isEmpty() || quantities.isEmpty()) {
            throw new BadRequestException("productIds and quantities must not be empty");
        }
        if (productIds.size() != quantities.size()) {
            throw new BadRequestException("productIds and quantities must have the same size");
        }

        User user = userService.getCurrentUser();

        Order order = new Order();
        order.setUser(user);

        BigDecimal total = BigDecimal.ZERO;

        for (int i = 0; i < productIds.size(); i++) {
            Long productId = productIds.get(i);
            int quantity = quantities.get(i);
            if (quantity <= 0) {
                throw new BadRequestException("quantity must be positive for product: " + productId);
            }

            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

            int available = product.getStock() == null ? 0 : product.getStock();
            if (available < quantity) {
                throw new ConflictException("Insufficient stock for: " + product.getName());
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(quantity);
            item.setPrice(product.getPrice());

            order.getItems().add(item);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));

            product.setStock(available - quantity);
            productRepository.save(product);
        }

        order.setTotalAmount(total);
        return orderRepository.save(order);
    }

    public List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getMyOrders() {
        return orderRepository.findByUserId(userService.getCurrentUser().getId());
    }

    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    /** Only the owner of the order or an administrator may read an order. */
    public Order getOrderByIdForCurrentUser(Long orderId) {
        Order order = getOrderById(orderId);
        User current = userService.getCurrentUser();
        boolean owner = order.getUser() != null
                && order.getUser().getId() != null
                && order.getUser().getId().equals(current.getId());
        if (current.getRole() != User.Role.ADMIN && !owner) {
            throw new AccessDeniedException("You are not allowed to view this order");
        }
        return order;
    }

    public Order updateStatus(Long orderId, Order.OrderStatus status) {
        Order order = getOrderById(orderId);
        order.setStatus(status);
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
