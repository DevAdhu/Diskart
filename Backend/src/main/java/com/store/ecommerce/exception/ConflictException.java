package com.store.ecommerce.exception;

/**
 * Raised when a request conflicts with the current state of a resource
 * (for example, insufficient stock). Mapped to HTTP 409.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
