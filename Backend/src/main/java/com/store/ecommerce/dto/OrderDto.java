package com.store.ecommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderDto {
    private Long id;
    private String userName;
    private String userEmail;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal shippingFee;
    /** Final payable amount = subtotal + tax + shippingFee. */
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;

    /* Address snapshot captured at checkout time. */
    private String recipientName;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String phone;

    @Data
    public static class OrderItemDto {
        private Long productId;
        private String productName;
        private Integer quantity;
        private BigDecimal price;
    }
}
