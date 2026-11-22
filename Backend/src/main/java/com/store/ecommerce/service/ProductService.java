package com.store.ecommerce.service;

import com.store.ecommerce.dto.PagedResponse;
import com.store.ecommerce.dto.ProductRequest;
import com.store.ecommerce.exception.BadRequestException;
import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.ProductImage;
import com.store.ecommerce.repository.ProductImageRepository;
import com.store.ecommerce.repository.ProductRepository;
import com.store.ecommerce.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Set<String> ALLOWED_SORT_FIELDS =
            Set.of("id", "name", "description", "price", "stock", "category");
    private static final int MAX_PAGE_SIZE = 100;
    private static final int MAX_SUGGESTION_LIMIT = 20;

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ReviewRepository reviewRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::withReviewStats)
                .toList();
    }

    public Product getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return withReviewStats(product);
    }

    /** Backwards-compatible overload used by existing callers. */
    public PagedResponse<Product> getProductsPaged(int page, int size, String sort,
                                                    String keyword, String category) {
        return getProductsPaged(page, size, sort, keyword, category,
                null, null, null, null);
    }

    /**
     * Paginated listing with optional keyword/category/brand/price/rating filters.
     * A minimum rating is resolved to product ids via the reviews table first.
     */
    public PagedResponse<Product> getProductsPaged(int page, int size, String sort,
                                                    String keyword, String category,
                                                    BigDecimal minPrice, BigDecimal maxPrice,
                                                    List<String> brand, Double minRating) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                parseSort(sort));

        List<Long> ratedProductIds = null;
        if (minRating != null) {
            ratedProductIds = reviewRepository
                    .findProductIdsWithAverageRatingAtLeast(minRating);
            if (ratedProductIds.isEmpty()) {
                return PagedResponse.from(Page.empty(pageable));
            }
        }

        Specification<Product> spec = buildSpecification(
                keyword, category, brand, minPrice, maxPrice, ratedProductIds);
        Page<Product> result = productRepository.findAll(spec, pageable);
        result.getContent().forEach(this::withReviewStats);
        return PagedResponse.from(result);
    }

    private Specification<Product> buildSpecification(String keyword, String category,
                                                       List<String> brands, BigDecimal minPrice,
                                                       BigDecimal maxPrice,
                                                       List<Long> ratedProductIds) {
        Specification<Product> spec = Specification.where(null);

        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.<String>get("name")), pattern));
        }
        if (category != null && !category.isBlank()) {
            String value = category.trim();
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.<String>get("category"), value));
        }
        if (brands != null && !brands.isEmpty()) {
            List<String> normalized = brands.stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(value -> value.trim().toLowerCase(Locale.ROOT))
                    .distinct()
                    .toList();
            if (!normalized.isEmpty()) {
                spec = spec.and((root, query, cb) ->
                        cb.lower(root.<String>get("brand")).in(normalized));
            }
        }
        if (minPrice != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.<BigDecimal>get("price"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.<BigDecimal>get("price"), maxPrice));
        }
        if (ratedProductIds != null) {
            spec = spec.and((root, query, cb) ->
                    root.<Long>get("id").in(ratedProductIds));
        }
        return spec;
    }

    private Sort parseSort(String sortParam) {
        if (sortParam == null || sortParam.isBlank()) {
            return Sort.by(Sort.Direction.ASC, "name");
        }
        String[] parts = sortParam.split(",", -1);
        String field = parts[0].trim();
        if (!ALLOWED_SORT_FIELDS.contains(field)) {
            throw new BadRequestException("Unsupported sort field: " + field);
        }
        if (parts.length == 1) {
            return Sort.by(Sort.Direction.ASC, field);
        }
        try {
            return Sort.by(Sort.Direction.fromString(parts[1].trim()), field);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported sort direction: " + parts[1], ex);
        }
    }

    public List<String> getBrands() {
        return productRepository.findDistinctBrands().stream()
                .filter(brand -> brand != null && !brand.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    /** Case-insensitive, alphabetically ordered type-ahead suggestions. */
    public List<Product> getSuggestions(String query, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        int capped = Math.min(Math.max(limit, 1), MAX_SUGGESTION_LIMIT);
        return productRepository.findByNameContainingIgnoreCaseOrderByNameAsc(
                        query.trim(), PageRequest.of(0, capped)).stream()
                .map(this::withReviewStats)
                .toList();
    }

    public Product createProduct(ProductRequest request) {
        Product product = new Product();
        applyRequest(product, request);
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, ProductRequest request) {
        Product existing = getProductById(id);
        applyRequest(existing, request);
        return productRepository.save(existing);
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setDescription(request.getDescription());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());
        product.setBrand(request.getBrand());
        product.setSku(request.getSku());
        product.setWarranty(request.getWarranty());
        product.setSpecifications(request.getSpecifications());
    }

    /** Populates the transient review aggregates used by ProductDto. */
    public Product withReviewStats(Product product) {
        if (product.getId() != null) {
            Double average = reviewRepository.findAverageRatingByProductId(product.getId());
            product.setAverageRating(average == null
                    ? null
                    : Math.round(average * 100.0) / 100.0);
            product.setReviewCount(reviewRepository.countByProductId(product.getId()));
        }
        return product;
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::withReviewStats)
                .toList();
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category).stream()
                .map(this::withReviewStats)
                .toList();
    }

    public Product addImages(Long productId, List<String> imageUrls) {
        Product product = getProductById(productId);
        for (int i = 0; i < imageUrls.size(); i++) {
            ProductImage img = new ProductImage();
            img.setProduct(product);
            img.setImageUrl(imageUrls.get(i));
            img.setDisplayOrder(i);
            productImageRepository.save(img);
        }
        return getProductById(productId);
    }
}
