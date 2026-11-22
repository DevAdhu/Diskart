package com.store.ecommerce.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Small, stable pagination envelope returned by paginated endpoints.
 */
public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    public <R> PagedResponse<R> map(Function<? super T, R> mapper) {
        List<R> mapped = content.stream().map(mapper).toList();
        return new PagedResponse<R>(mapped, page, size, totalElements, totalPages);
    }
}
