package com.store.ecommerce.controller;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.OrderDto;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<OrderDto> placeOrder(
            @RequestParam Long userId,
            @RequestBody Map<String, Object> body) {

        List<Integer> rawProductIds = (List<Integer>) body.get("productIds");
        List<Integer> quantities = (List<Integer>) body.get("quantities");
        List<Long> productIds = rawProductIds.stream()
            .map(Long::valueOf).toList();

        Order order = orderService.placeOrder(userId, productIds, quantities);
        return ResponseEntity.ok(DtoMapper.toOrderDto(order));
    }

    @GetMapping("/user/{userId}")
    public List<OrderDto> getOrdersByUser(@PathVariable Long userId) {
        return orderService.getOrdersByUser(userId)
            .stream()
            .map(DtoMapper::toOrderDto)
            .toList();
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(
            DtoMapper.toOrderDto(orderService.getOrderById(orderId)));
    }

    @GetMapping
    public List<OrderDto> getAllOrders() {
        return orderService.getAllOrders()
            .stream()
            .map(DtoMapper::toOrderDto)
            .toList();
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderDto> updateStatus(
            @PathVariable Long orderId,
            @RequestParam Order.OrderStatus status) {
        return ResponseEntity.ok(
            DtoMapper.toOrderDto(orderService.updateStatus(orderId, status)));
    }
}