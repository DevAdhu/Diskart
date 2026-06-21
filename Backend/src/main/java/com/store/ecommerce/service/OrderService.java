package com.store.ecommerce.service;

import com.store.ecommerce.model.*;
import com.store.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public Order placeOrder(Long userId, List<Long> productIds, List<Integer> quantities) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Order order = new Order();
        order.setUser(user);

        BigDecimal total = BigDecimal.ZERO;

        for (int i = 0; i < productIds.size(); i++) {
            Product product = productRepository.findById(productIds.get(i))
                .orElseThrow(() -> new RuntimeException("Product not found"));

            if (product.getStock() < quantities.get(i)) {
                throw new RuntimeException("Insufficient stock for: " + product.getName());
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(quantities.get(i));
            item.setPrice(product.getPrice());

            order.getItems().add(item);
            total = total.add(product.getPrice()
                .multiply(BigDecimal.valueOf(quantities.get(i))));

            product.setStock(product.getStock() - quantities.get(i));
            productRepository.save(product);
        }

        order.setTotalAmount(total);
        return orderRepository.save(order);
    }

    public List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
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