package com.store.ecommerce.dto;

import com.store.ecommerce.model.*;
import java.util.stream.Collectors;
import com.store.ecommerce.model.ProductImage;

public class DtoMapper {

    public static UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        return dto;
    }

    public static ProductDto toProductDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setStock(product.getStock());
        dto.setCategory(product.getCategory());
        dto.setImageUrl(product.getImageUrl());
        dto.setBrand(product.getBrand());
        dto.setSku(product.getSku());
        dto.setWarranty(product.getWarranty());
        dto.setSpecifications(product.getSpecifications());
        dto.setAverageRating(product.getAverageRating());
        dto.setReviewCount(product.getReviewCount());

        if (product.getImages() != null) {
            dto.setImages(product.getImages()
                    .stream()
                    .sorted((a, b) -> a.getDisplayOrder() - b.getDisplayOrder())
                    .map(ProductImage::getImageUrl)
                    .collect(java.util.stream.Collectors.toList()));
        } else {
            dto.setImages(new java.util.ArrayList<>());
        }
        return dto;
    }

    public static OrderDto toOrderDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setUserName(order.getUser().getName());
        dto.setUserEmail(order.getUser().getEmail());
        dto.setStatus(order.getStatus().name());
        dto.setSubtotal(order.getSubtotal());
        dto.setTax(order.getTax());
        dto.setShippingFee(order.getShippingFee());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setRecipientName(order.getRecipientName());
        dto.setAddressLine1(order.getAddressLine1());
        dto.setAddressLine2(order.getAddressLine2());
        dto.setCity(order.getCity());
        dto.setState(order.getState());
        dto.setPostalCode(order.getPostalCode());
        dto.setCountry(order.getCountry());
        dto.setPhone(order.getPhone());
        dto.setItems(order.getItems().stream().map(item -> {
            OrderDto.OrderItemDto itemDto = new OrderDto.OrderItemDto();
            itemDto.setProductId(item.getProduct().getId());
            itemDto.setProductName(item.getProduct().getName());
            itemDto.setQuantity(item.getQuantity());
            itemDto.setPrice(item.getPrice());
            return itemDto;
        }).collect(Collectors.toList()));
        return dto;
    }

    public static OrderStatusHistoryDto toOrderStatusHistoryDto(OrderStatusHistory history) {
        OrderStatusHistoryDto dto = new OrderStatusHistoryDto();
        dto.setId(history.getId());
        dto.setStatus(history.getStatus().name());
        dto.setNote(history.getNote());
        dto.setChangedAt(history.getChangedAt());
        return dto;
    }

    public static AddressDto toAddressDto(Address address) {
        AddressDto dto = new AddressDto();
        dto.setId(address.getId());
        dto.setLabel(address.getLabel());
        dto.setLine1(address.getLine1());
        dto.setLine2(address.getLine2());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPostalCode(address.getPostalCode());
        dto.setCountry(address.getCountry());
        dto.setPhone(address.getPhone());
        dto.setDefault(address.isDefault());
        return dto;
    }

    public static ReviewDto toReviewDto(Review review) {
        ReviewDto dto = new ReviewDto();
        dto.setId(review.getId());
        dto.setUserId(review.getUser().getId());
        dto.setUserName(review.getUser().getName());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        return dto;
    }
}
