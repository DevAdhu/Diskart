package com.store.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    private Integer stock;

    private String imageUrl;

    private String category;

    /* Optional richer product details managed by admins. */
    private String brand;
    private String sku;
    private String warranty;
    @Column(length = 4000)
    private String specifications;

    /**
     * Review aggregates are computed by the service layer from the reviews table;
     * they are intentionally not persisted on the product row.
     */
    @Transient
    private Double averageRating;

    @Transient
    private long reviewCount;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<ProductImage> images = new ArrayList<>();
}
