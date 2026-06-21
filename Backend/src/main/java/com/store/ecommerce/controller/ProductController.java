package com.store.ecommerce.controller;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.ProductDto;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductDto> getAllProducts() {
        return productService.getAllProducts()
            .stream().map(DtoMapper::toProductDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(DtoMapper.toProductDto(
            productService.getProductById(id)));
    }

    @GetMapping("/search")
    public List<ProductDto> searchProducts(@RequestParam String keyword) {
        return productService.searchProducts(keyword)
            .stream().map(DtoMapper::toProductDto).toList();
    }

    @GetMapping("/category/{category}")
    public List<ProductDto> getByCategory(@PathVariable String category) {
        return productService.getProductsByCategory(category)
            .stream().map(DtoMapper::toProductDto).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDto> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(DtoMapper.toProductDto(
            productService.createProduct(product)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id,
                                                     @RequestBody Product product) {
        return ResponseEntity.ok(DtoMapper.toProductDto(
            productService.updateProduct(id, product)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}