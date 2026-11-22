package com.store.ecommerce.service;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.OrderDto;
import com.store.ecommerce.dto.RazorpayFailureRequest;
import com.store.ecommerce.dto.RazorpayOrderRequest;
import com.store.ecommerce.dto.RazorpayOrderResponse;
import com.store.ecommerce.dto.RazorpayVerifyRequest;
import com.store.ecommerce.exception.BadRequestException;
import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.Address;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.model.Payment;
import com.store.ecommerce.repository.OrderRepository;
import com.store.ecommerce.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Orchestrates the three Razorpay checkout steps. */
@Service
@RequiredArgsConstructor
public class CheckoutService {

    private static final BigDecimal PAISE_PER_RUPEE = new BigDecimal("100");

    private final OrderService orderService;
    private final AddressService addressService;
    private final RazorpayService razorpayService;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    /** Step 1: validate the address, reserve stock and create a Razorpay order. */
    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(RazorpayOrderRequest request) {
        Address address = addressService.getOwnedAddress(request.getAddressId());
        Order order = orderService.createPendingOrder(
                address, request.getProductIds(), request.getQuantities());

        long amountPaise = order.getTotalAmount()
                .multiply(PAISE_PER_RUPEE)
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        // With the placeholder/test key id the frontend cannot open a real
        // checkout, so generate the id locally instead of calling Razorpay.
        String razorpayOrderId = razorpayService.isDemoMode()
                ? razorpayService.createDemoOrderId(order.getId())
                : razorpayService.createOrder(amountPaise, "order_" + order.getId());

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setRazorpayOrderId(razorpayOrderId);
        payment.setAmountPaise(amountPaise);
        payment.setStatus(Payment.PaymentStatus.CREATED);
        paymentRepository.save(payment);

        return new RazorpayOrderResponse(
                order.getId(), razorpayOrderId, amountPaise, "INR", razorpayService.getKeyId());
    }

    /** Step 2: verify the signature, then confirm the order and capture the payment. */
    @Transactional
    public OrderDto verifyPayment(RazorpayVerifyRequest request) {
        Order order = orderService.getOrderByIdForCurrentUser(request.getOrderId());
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment not found for order: " + order.getId()));

        if (order.getStatus() == Order.OrderStatus.CONFIRMED) {
            return DtoMapper.toOrderDto(order);
        }
        if (order.getStatus() == Order.OrderStatus.PAYMENT_FAILED) {
            throw new BadRequestException("Cannot verify a failed order");
        }

        if (razorpayService.isDemoMode()) {
            // The client posts dummy values (demo_signature, demo_payment_...).
            // Accept them so the flow is fully usable out of the box.
            if (request.getRazorpayOrderId() != null && !request.getRazorpayOrderId().isBlank()) {
                payment.setRazorpayOrderId(request.getRazorpayOrderId());
            }
        } else {
            if (!request.getRazorpayOrderId().equals(payment.getRazorpayOrderId())) {
                throw new BadRequestException("Razorpay order id does not match this order");
            }
            // Throws BadRequestException on mismatch, leaving the order PENDING.
            razorpayService.verifySignature(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature());
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(Payment.PaymentStatus.CAPTURED);
        paymentRepository.save(payment);

        order.setStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(order);
        return DtoMapper.toOrderDto(order);
    }

    /** Step 3: mark the payment failed and release the reserved stock. */
    @Transactional
    public OrderDto recordFailure(RazorpayFailureRequest request) {
        Order order = orderService.getOrderByIdForCurrentUser(request.getOrderId());
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (payment != null) {
            if (request.getRazorpayOrderId() != null && !request.getRazorpayOrderId().isBlank()) {
                payment.setRazorpayOrderId(request.getRazorpayOrderId());
            }
            payment.setStatus(Payment.PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        if (order.getStatus() == Order.OrderStatus.CONFIRMED) {
            throw new BadRequestException("Cannot fail a confirmed order");
        }
        if (order.getStatus() != Order.OrderStatus.PAYMENT_FAILED) {
            orderService.restoreStock(order);
            order.setStatus(Order.OrderStatus.PAYMENT_FAILED);
            orderRepository.save(order);
        }
        return DtoMapper.toOrderDto(order);
    }
}
