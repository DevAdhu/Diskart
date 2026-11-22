package com.store.ecommerce.service;

import com.store.ecommerce.dto.OrderDto;
import com.store.ecommerce.dto.RazorpayFailureRequest;
import com.store.ecommerce.dto.RazorpayVerifyRequest;
import com.store.ecommerce.exception.BadRequestException;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.model.OrderItem;
import com.store.ecommerce.model.Payment;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.OrderRepository;
import com.store.ecommerce.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock
    private OrderService orderService;
    @Mock
    private AddressService addressService;
    @Mock
    private RazorpayService razorpayService;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private OrderRepository orderRepository;

    private CheckoutService checkoutService;

    @BeforeEach
    void setUp() {
        checkoutService = new CheckoutService(
                orderService, addressService, razorpayService, paymentRepository, orderRepository);
    }

    private static Order pendingOrder() {
        User user = new User();
        user.setId(7L);
        user.setName("Buyer");
        user.setEmail("buyer@example.com");

        Product product = new Product();
        product.setId(1L);
        product.setName("Shoe");

        OrderItem item = new OrderItem();
        item.setProduct(product);
        item.setQuantity(2);
        item.setPrice(new BigDecimal("10.00"));

        Order order = new Order();
        order.setId(10L);
        order.setUser(user);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setSubtotal(new BigDecimal("20.00"));
        order.setTax(new BigDecimal("3.60"));
        order.setShippingFee(new BigDecimal("40"));
        order.setTotalAmount(new BigDecimal("63.60"));
        order.setItems(new ArrayList<>(java.util.List.of(item)));
        return order;
    }

    private static Payment createdPayment(Order order) {
        Payment payment = new Payment();
        payment.setId(5L);
        payment.setOrder(order);
        payment.setRazorpayOrderId("demo_order_10");
        payment.setAmountPaise(6360L);
        payment.setStatus(Payment.PaymentStatus.CREATED);
        return payment;
    }

    @Test
    void demoModeAcceptsDummySignatureAndConfirmsOrder() {
        Order order = pendingOrder();
        Payment payment = createdPayment(order);
        when(orderService.getOrderByIdForCurrentUser(10L)).thenReturn(order);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));
        when(razorpayService.isDemoMode()).thenReturn(true);

        RazorpayVerifyRequest request = new RazorpayVerifyRequest();
        request.setOrderId(10L);
        request.setRazorpayOrderId("demo_order_10");
        request.setRazorpayPaymentId("demo_payment_123");
        request.setRazorpaySignature("demo_signature");

        OrderDto result = checkoutService.verifyPayment(request);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
        assertThat(result.getTotalAmount()).isEqualByComparingTo("63.60");
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.CAPTURED);
        assertThat(payment.getRazorpayPaymentId()).isEqualTo("demo_payment_123");
        verify(orderRepository).save(order);
        verify(paymentRepository).save(payment);
        verify(razorpayService, never()).verifySignature(any(), any(), any());
    }

    @Test
    void realModeRejectsBadSignatureAndLeavesOrderPending() {
        Order order = pendingOrder();
        Payment payment = createdPayment(order);
        when(orderService.getOrderByIdForCurrentUser(10L)).thenReturn(order);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));
        when(razorpayService.isDemoMode()).thenReturn(false);
        doThrow(new BadRequestException("Razorpay signature verification failed"))
                .when(razorpayService).verifySignature(any(), any(), any());

        RazorpayVerifyRequest request = new RazorpayVerifyRequest();
        request.setOrderId(10L);
        request.setRazorpayOrderId("demo_order_10");
        request.setRazorpayPaymentId("pay_real");
        request.setRazorpaySignature("wrong");

        assertThatThrownBy(() -> checkoutService.verifyPayment(request))
                .isInstanceOf(BadRequestException.class);

        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PENDING);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.CREATED);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void failureMarksOrderFailedAndRestoresStock() {
        Order order = pendingOrder();
        Payment payment = createdPayment(order);
        when(orderService.getOrderByIdForCurrentUser(10L)).thenReturn(order);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));

        RazorpayFailureRequest request = new RazorpayFailureRequest();
        request.setOrderId(10L);
        request.setRazorpayOrderId("demo_order_10");
        request.setReason("user dismissed");

        OrderDto result = checkoutService.recordFailure(request);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getStatus()).isEqualTo("PAYMENT_FAILED");
        assertThat(order.getStatus()).isEqualTo(Order.OrderStatus.PAYMENT_FAILED);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.FAILED);
        verify(orderService).restoreStock(order);
        verify(orderRepository).save(order);
    }
}
