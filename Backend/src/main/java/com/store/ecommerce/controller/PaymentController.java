package com.store.ecommerce.controller;

import com.store.ecommerce.dto.OrderDto;
import com.store.ecommerce.dto.RazorpayFailureRequest;
import com.store.ecommerce.dto.RazorpayOrderRequest;
import com.store.ecommerce.dto.RazorpayOrderResponse;
import com.store.ecommerce.dto.RazorpayVerifyRequest;
import com.store.ecommerce.service.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/razorpay")
@RequiredArgsConstructor
public class PaymentController {

    private final CheckoutService checkoutService;

    /** Step 1: reserve stock and create a Razorpay order. */
    @PostMapping("/order")
    public ResponseEntity<RazorpayOrderResponse> createOrder(
            @Valid @RequestBody RazorpayOrderRequest request) {
        return ResponseEntity.ok(checkoutService.createRazorpayOrder(request));
    }

    /** Step 2: verify signature, confirm the order and capture the payment. */
    @PostMapping("/verify")
    public ResponseEntity<OrderDto> verify(@Valid @RequestBody RazorpayVerifyRequest request) {
        return ResponseEntity.ok(checkoutService.verifyPayment(request));
    }

    /** Step 3: record failure and restore stock. */
    @PostMapping("/failure")
    public ResponseEntity<OrderDto> failure(@Valid @RequestBody RazorpayFailureRequest request) {
        return ResponseEntity.ok(checkoutService.recordFailure(request));
    }
}
