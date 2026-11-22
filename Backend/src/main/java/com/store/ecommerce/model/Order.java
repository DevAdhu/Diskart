package com.store.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @JsonIgnore
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    /** Sum of item prices (before tax and shipping). */
    private BigDecimal subtotal;

    /** 18% of the subtotal, computed server-side. */
    private BigDecimal tax;

    /** 40 when 0 < subtotal < 499, otherwise 0 (free). */
    private BigDecimal shippingFee;

    /** Final payable amount = subtotal + tax + shippingFee. */
    private BigDecimal totalAmount;

    /* Immutable address snapshot taken at checkout time. */
    private String recipientName;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String phone;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum OrderStatus {
        PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED, PAYMENT_FAILED
    }
}
