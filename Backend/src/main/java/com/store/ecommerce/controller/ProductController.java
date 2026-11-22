package com.store.ecommerce.controller;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.PagedResponse;
import com.store.ecommerce.dto.ProductDto;
import com.store.ecommerce.dto.ProductRequest;
import com.store.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /** Kept for backwards compatibility; use /paged for pagination. */
    @GetMapping
    public List<ProductDto> getAllProducts() {
        return productService.getAllProducts()
                .stream().map(DtoMapper::toProductDto).toList();
    }

    /**
     * Paginated listing with optional filters. Example:
     * /api/products/paged?page=0&size=12&sort=name,asc&keyword=shoe&category=footwear
     * &minPrice=100&maxPrice=500&brand=Nike&minRating=4
     */
    @GetMapping("/paged")
    public PagedResponse<ProductDto> getPagedProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name,asc") String sort,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) List<String> brand,
            @RequestParam(required = false) Double minRating) {
        return productService.getProductsPaged(page, size, sort, keyword, category,
                minPrice, maxPrice, brand, minRating)
                .map(DtoMapper::toProductDto);
    }

    /** Distinct, non-null brands for the filter UI. */
    @GetMapping("/brands")
    public List<String> getBrands() {
        return productService.getBrands();
    }

    /** Lightweight, case-insensitive name suggestions for the search box. */
    @GetMapping("/suggest")
    public List<ProductDto> getSuggestions(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int limit) {
        return productService.getSuggestions(q, limit).stream()
                .map(DtoMapper::toProductDto)
                .toList();
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
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(DtoMapper.toProductDto(
                productService.createProduct(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDto> updateProduct(@PathVariable Long id,
                                                    @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(DtoMapper.toProductDto(
                productService.updateProduct(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductDto> addImages(
            @PathVariable Long id,
            @RequestBody List<String> imageUrls) {
        return ResponseEntity.ok(DtoMapper.toProductDto(
                productService.addImages(id, imageUrls)));
    }
}
