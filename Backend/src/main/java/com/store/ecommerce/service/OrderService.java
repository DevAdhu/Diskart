package com.store.ecommerce.service;

import com.store.ecommerce.exception.BadRequestException;
import com.store.ecommerce.exception.ConflictException;
import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.Address;
import com.store.ecommerce.model.Order;
import com.store.ecommerce.model.OrderItem;
import com.store.ecommerce.model.OrderStatusHistory;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.OrderRepository;
import com.store.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class OrderService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.18");
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("499");
    private static final BigDecimal SHIPPING_FEE = new BigDecimal("40");
    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserService userService;
    private final OrderStatusHistoryService historyService;

    /** Kept for callers that do not participate in status-history recording. */
    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
                        UserService userService) {
        this(orderRepository, productRepository, userService, null);
    }

    @Autowired
    public OrderService(OrderRepository orderRepository, ProductRepository productRepository,
                        UserService userService, OrderStatusHistoryService historyService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userService = userService;
        this.historyService = historyService;
    }

    /**
     * Places an order for the authenticated user. Products are locked with a
     * pessimistic write lock while stock is checked and decremented, so two
     * concurrent orders cannot oversell the same product.
     */
    @Transactional
    public Order placeOrder(List<Long> productIds, List<Integer> quantities) {
        return createPendingOrder(null, productIds, quantities);
    }

    /**
     * Shared stock-reservation logic used by both the legacy place-order endpoint
     * and the Razorpay checkout flow. Prices are always recomputed server-side.
     * When an address is supplied its details are snapshotted onto the order.
     */
    @Transactional
    public Order createPendingOrder(Address address, List<Long> productIds,
                                     List<Integer> quantities) {
        if (productIds == null || quantities == null || productIds.isEmpty() || quantities.isEmpty()) {
            throw new BadRequestException("productIds and quantities must not be empty");
        }
        if (productIds.size() != quantities.size()) {
            throw new BadRequestException("productIds and quantities must have the same size");
        }

        User user = userService.getCurrentUser();

        Order order = new Order();
        order.setUser(user);
        applyAddressSnapshot(order, user, address);

        BigDecimal subtotal = BigDecimal.ZERO;

        for (int i = 0; i < productIds.size(); i++) {
            Long productId = productIds.get(i);
            int quantity = quantities.get(i);
            if (quantity <= 0) {
                throw new BadRequestException("quantity must be positive for product: " + productId);
            }

            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

            int available = product.getStock() == null ? 0 : product.getStock();
            if (available < quantity) {
                throw new ConflictException("Insufficient stock for: " + product.getName());
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(quantity);
            item.setPrice(product.getPrice());

            order.getItems().add(item);
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));

            product.setStock(available - quantity);
            productRepository.save(product);
        }

        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        // Shipping is charged only for small non-empty carts: 0 < subtotal < 499.
        BigDecimal shippingFee = subtotal.signum() > 0 && subtotal.compareTo(FREE_SHIPPING_THRESHOLD) < 0
                ? SHIPPING_FEE
                : ZERO;

        order.setSubtotal(subtotal);
        order.setTax(tax);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(subtotal.add(tax).add(shippingFee).setScale(2, RoundingMode.HALF_UP));
        order.setStatus(Order.OrderStatus.PENDING);
        Order saved = orderRepository.save(order);
        recordStatus(saved, Order.OrderStatus.PENDING, "Order placed");
        return saved;
    }

    /** Restores reserved stock, e.g. when a Razorpay payment fails. */
    @Transactional
    public void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found: " + item.getProduct().getId()));
            int current = product.getStock() == null ? 0 : product.getStock();
            product.setStock(current + item.getQuantity());
            productRepository.save(product);
        }
    }

    private static void applyAddressSnapshot(Order order, User user, Address address) {
        if (address == null) {
            return;
        }
        order.setRecipientName(user.getName());
        order.setAddressLine1(address.getLine1());
        order.setAddressLine2(address.getLine2());
        order.setCity(address.getCity());
        order.setState(address.getState());
        order.setPostalCode(address.getPostalCode());
        order.setCountry(address.getCountry());
        order.setPhone(address.getPhone());
    }

    public List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getMyOrders() {
        return orderRepository.findByUserId(userService.getCurrentUser().getId());
    }

    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    /** Only the owner of the order or an administrator may read an order. */
    public Order getOrderByIdForCurrentUser(Long orderId) {
        Order order = getOrderById(orderId);
        User current = userService.getCurrentUser();
        boolean owner = isOwner(order, current);
        if (current.getRole() != User.Role.ADMIN && !owner) {
            throw new AccessDeniedException("You are not allowed to view this order");
        }
        return order;
    }

    /** Owner-or-admin access, reused by the order history endpoint. */
    @Transactional(readOnly = true)
    public List<OrderStatusHistory> getHistory(Long orderId) {
        getOrderByIdForCurrentUser(orderId);
        if (historyService == null) {
            return List.of();
        }
        return historyService.getHistory(orderId);
    }

    /**
     * Cancellation is restricted to the order owner and only valid before the
     * order has shipped. Reserved stock is released and a history entry is added.
     */
    @Transactional
    public Order cancelOrder(Long orderId) {
        Order order = getOrderById(orderId);
        User current = userService.getCurrentUser();
        if (!isOwner(order, current)) {
            throw new AccessDeniedException("Only the order owner can cancel this order");
        }
        Order.OrderStatus status = order.getStatus();
        if (status != Order.OrderStatus.PENDING && status != Order.OrderStatus.CONFIRMED) {
            throw new ConflictException("Order cannot be cancelled in status " + status);
        }
        restoreStock(order);
        order.setStatus(Order.OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        recordStatus(saved != null ? saved : order,
                Order.OrderStatus.CANCELLED, "Cancelled by customer");
        return saved != null ? saved : order;
    }

    private static boolean isOwner(Order order, User user) {
        return order.getUser() != null
                && order.getUser().getId() != null
                && order.getUser().getId().equals(user.getId());
    }

    private void recordStatus(Order order, Order.OrderStatus status, String note) {
        if (historyService != null) {
            historyService.record(order, status, note);
        }
    }

    public Order updateStatus(Long orderId, Order.OrderStatus status) {
        Order order = getOrderById(orderId);
        order.setStatus(status);
        Order saved = orderRepository.save(order);
        recordStatus(saved, status, "Status updated by admin");
        return saved;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
