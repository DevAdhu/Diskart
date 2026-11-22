package com.store.ecommerce.controller;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.OrderDto;
import com.store.ecommerce.dto.PlaceOrderRequest;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** The user is derived from the JWT principal; no userId parameter is accepted. */
    @PostMapping("/place")
    public ResponseEntity<OrderDto> placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        Order order = orderService.placeOrder(request.getProductIds(), request.getQuantities());
        return ResponseEntity.ok(DtoMapper.toOrderDto(order));
    }

    @GetMapping("/mine")
    public List<OrderDto> getMyOrders() {
        return orderService.getMyOrders()
                .stream()
                .map(DtoMapper::toOrderDto)
                .toList();
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderDto> getOrdersByUser(@PathVariable Long userId) {
        return orderService.getOrdersByUser(userId)
                .stream()
                .map(DtoMapper::toOrderDto)
                .toList();
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDto> getOrderById(@PathVariable Long orderId) {
        return ResponseEntity.ok(
                DtoMapper.toOrderDto(orderService.getOrderByIdForCurrentUser(orderId)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderDto> getAllOrders() {
        return orderService.getAllOrders()
                .stream()
                .map(DtoMapper::toOrderDto)
                .toList();
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDto> updateStatus(
            @PathVariable Long orderId,
            @RequestParam Order.OrderStatus status) {
        return ResponseEntity.ok(
                DtoMapper.toOrderDto(orderService.updateStatus(orderId, status)));
    }
}
