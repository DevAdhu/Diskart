package com.store.ecommerce.service;

import com.store.ecommerce.dto.RazorpayFailureRequest;
import com.store.ecommerce.dto.RazorpayVerifyRequest;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.model.OrderStatusHistory;
import com.store.ecommerce.model.Payment;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.OrderRepository;
import com.store.ecommerce.repository.OrderStatusHistoryRepository;
import com.store.ecommerce.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutStatusHistoryTest {

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
    @Mock
    private OrderStatusHistoryRepository historyRepository;

    private CheckoutService checkoutService;

    @BeforeEach
    void setUp() {
        OrderStatusHistoryService historyService =
                new OrderStatusHistoryService(historyRepository);
        checkoutService = new CheckoutService(
                orderService, addressService, razorpayService,
                paymentRepository, orderRepository, historyService);
    }

    private static Order pendingOrder() {
        User user = new User();
        user.setId(7L);
        user.setName("Buyer");
        user.setEmail("buyer@example.com");

        Order order = new Order();
        order.setId(10L);
        order.setUser(user);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setSubtotal(new BigDecimal("20.00"));
        order.setTax(new BigDecimal("3.60"));
        order.setShippingFee(new BigDecimal("40"));
        order.setTotalAmount(new BigDecimal("63.60"));
        order.setItems(new ArrayList<>());
        return order;
    }

    private static Payment payment(Order order) {
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setRazorpayOrderId("demo_order_10");
        payment.setStatus(Payment.PaymentStatus.CREATED);
        return payment;
    }

    @Test
    void verifyingPaymentRecordsConfirmedHistoryEntry() {
        Order order = pendingOrder();
        when(orderService.getOrderByIdForCurrentUser(10L)).thenReturn(order);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment(order)));
        when(razorpayService.isDemoMode()).thenReturn(true);
        when(orderRepository.save(order)).thenReturn(order);

        RazorpayVerifyRequest request = new RazorpayVerifyRequest();
        request.setOrderId(10L);
        request.setRazorpayOrderId("demo_order_10");
        request.setRazorpayPaymentId("demo_payment_1");
        request.setRazorpaySignature("demo_signature");

        checkoutService.verifyPayment(request);

        ArgumentCaptor<OrderStatusHistory> captor =
                ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(historyRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(Order.OrderStatus.CONFIRMED);
        assertThat(captor.getValue().getNote()).isEqualTo("Payment verified");
    }

    @Test
    void recordingFailureRecordsPaymentFailedHistoryEntry() {
        Order order = pendingOrder();
        when(orderService.getOrderByIdForCurrentUser(10L)).thenReturn(order);
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment(order)));
        when(orderRepository.save(order)).thenReturn(order);

        RazorpayFailureRequest request = new RazorpayFailureRequest();
        request.setOrderId(10L);
        request.setReason("dismissed");

        checkoutService.recordFailure(request);

        ArgumentCaptor<OrderStatusHistory> captor =
                ArgumentCaptor.forClass(OrderStatusHistory.class);
        verify(historyRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(Order.OrderStatus.PAYMENT_FAILED);
        assertThat(captor.getValue().getNote()).isEqualTo("Payment failed");
    }
}
