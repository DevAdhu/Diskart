package com.store.ecommerce.repository;

import com.store.ecommerce.model.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>,
        JpaSpecificationExecutor<Product> {

    List<Product> findByCategory(String category);

    List<Product> findByNameContainingIgnoreCase(String name);

    /**
     * Pessimistic write lock used when placing orders so two concurrent buyers
     * cannot both observe and consume the same last unit of stock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    Page<Product> findAll(Pageable pageable);

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Product> findByCategory(String category, Pageable pageable);

    Page<Product> findByNameContainingIgnoreCaseAndCategory(String name, String category, Pageable pageable);

    /** Distinct, non-blank brands for the search-filter UI. */
    @Query("select distinct p.brand from Product p "
            + "where p.brand is not null and trim(p.brand) <> '' order by p.brand asc")
    List<String> findDistinctBrands();

    /** Case-insensitive type-ahead suggestions, alphabetically ordered. */
    List<Product> findByNameContainingIgnoreCaseOrderByNameAsc(String name, Pageable pageable);
}
