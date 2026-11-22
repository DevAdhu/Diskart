package com.store.ecommerce.repository;

import com.store.ecommerce.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Product ids bought together with the given product, most frequently
     * co-purchased first. The product itself is never returned.
     */
    @Query("select oi2.product.id from OrderItem oi2 "
            + "where oi2.order.id in "
            + "(select oi1.order.id from OrderItem oi1 where oi1.product.id = :productId) "
            + "and oi2.product.id <> :productId "
            + "group by oi2.product.id order by count(oi2.id) desc")
    List<Long> findCoPurchasedProductIds(@Param("productId") Long productId);
}
