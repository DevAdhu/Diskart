package com.store.ecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    private String razorpayOrderId;

    private String razorpayPaymentId;

    private String razorpaySignature;

    /** Amount charged, in paise (INR cents). */
    private Long amountPaise;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status = PaymentStatus.CREATED;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum PaymentStatus {
        CREATED, CAPTURED, FAILED
    }
}
