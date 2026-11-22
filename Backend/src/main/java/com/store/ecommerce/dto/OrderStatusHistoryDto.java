package com.store.ecommerce.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderStatusHistoryDto {

    private Long id;
    private String status;
    private String note;
    private LocalDateTime changedAt;
}
