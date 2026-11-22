package com.store.ecommerce.service;

import com.store.ecommerce.model.Order;
import com.store.ecommerce.model.OrderStatusHistory;
import com.store.ecommerce.repository.OrderStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderStatusHistoryService {

    private final OrderStatusHistoryRepository repository;

    /** Records one immutable entry for an order status transition. */
    public void record(Order order, Order.OrderStatus status, String note) {
        OrderStatusHistory entry = new OrderStatusHistory();
        entry.setOrder(order);
        entry.setStatus(status);
        entry.setNote(note);
        entry.setChangedAt(LocalDateTime.now());
        repository.save(entry);
    }

    public List<OrderStatusHistory> getHistory(Long orderId) {
        return repository.findByOrderIdOrderByChangedAtAsc(orderId);
    }
}
