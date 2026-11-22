package com.store.ecommerce.service;

import com.store.ecommerce.dto.AddressRequest;
import com.store.ecommerce.exception.BadRequestException;
import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.Address;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.AddressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserService userService;

    public List<Address> getMyAddresses() {
        User current = userService.getCurrentUser();
        return addressRepository.findByUserIdOrderByIsDefaultDescIdAsc(current.getId());
    }

    /**
     * Resolves an address only if it belongs to the current user. Used by
     * checkout so a client can never pass somebody else's address id.
     */
    public Address getOwnedAddress(Long id) {
        User current = userService.getCurrentUser();
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found: " + id));
        if (address.getUser() == null || address.getUser().getId() == null
                || !address.getUser().getId().equals(current.getId())) {
            throw new AccessDeniedException("You are not allowed to access this address");
        }
        return address;
    }

    @Transactional
    public Address createAddress(AddressRequest request) {
        requireText(request.getLine1(), "line1");
        requireText(request.getCity(), "city");
        requireText(request.getPostalCode(), "postalCode");
        requireText(request.getCountry(), "country");

        User current = userService.getCurrentUser();
        boolean makeDefault = Boolean.TRUE.equals(request.getIsDefault());
        if (makeDefault) {
            clearDefaults(current.getId());
        }
        Address address = new Address();
        address.setUser(current);
        applyRequest(address, request);
        address.setDefault(makeDefault);
        return addressRepository.save(address);
    }

    @Transactional
    public Address updateAddress(Long id, AddressRequest request) {
        Address address = getOwnedAddress(id);
        Boolean isDefault = request.getIsDefault();
        if (Boolean.TRUE.equals(isDefault)) {
            clearDefaults(address.getUser().getId());
        }
        applyUpdates(address, request);
        if (isDefault != null) {
            address.setDefault(isDefault);
        }
        return addressRepository.save(address);
    }

    @Transactional
    public void deleteAddress(Long id) {
        Address address = getOwnedAddress(id);
        addressRepository.delete(address);
    }

    private static void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(field + " is required");
        }
    }

    /** Ensures at most one default address per user. */
    private void clearDefaults(Long userId) {
        for (Address existing : addressRepository.findByUserIdOrderByIsDefaultDescIdAsc(userId)) {
            if (existing.isDefault()) {
                existing.setDefault(false);
                addressRepository.save(existing);
            }
        }
    }

    private static void applyRequest(Address address, AddressRequest request) {
        address.setLabel(request.getLabel());
        address.setLine1(request.getLine1());
        address.setLine2(request.getLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
        address.setPhone(request.getPhone());
    }

    /** Partial update: only overwrite fields the client actually supplied. */
    private static void applyUpdates(Address address, AddressRequest request) {
        if (request.getLabel() != null) address.setLabel(request.getLabel());
        if (request.getLine1() != null) address.setLine1(request.getLine1());
        if (request.getLine2() != null) address.setLine2(request.getLine2());
        if (request.getCity() != null) address.setCity(request.getCity());
        if (request.getState() != null) address.setState(request.getState());
        if (request.getPostalCode() != null) address.setPostalCode(request.getPostalCode());
        if (request.getCountry() != null) address.setCountry(request.getCountry());
        if (request.getPhone() != null) address.setPhone(request.getPhone());
    }
}
