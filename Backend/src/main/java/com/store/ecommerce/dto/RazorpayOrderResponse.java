package com.store.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Step 1 response, consumed by the Razorpay checkout script on the client. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayOrderResponse {

    private Long orderId;
    private String razorpayOrderId;
    private long amountPaise;
    private String currency = "INR";
    private String keyId;
}
