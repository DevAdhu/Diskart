package com.store.ecommerce.controller;

import com.store.ecommerce.dto.AddressDto;
import com.store.ecommerce.dto.AddressRequest;
import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.model.Address;
import com.store.ecommerce.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** All addresses are scoped to the authenticated user; no userId is accepted. */
@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public List<AddressDto> getMyAddresses() {
        return addressService.getMyAddresses().stream()
                .map(DtoMapper::toAddressDto)
                .toList();
    }

    @PostMapping
    public ResponseEntity<AddressDto> createAddress(@Valid @RequestBody AddressRequest request) {
        Address address = addressService.createAddress(request);
        return ResponseEntity.ok(DtoMapper.toAddressDto(address));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressDto> updateAddress(@PathVariable Long id,
                                                    @Valid @RequestBody AddressRequest request) {
        Address address = addressService.updateAddress(id, request);
        return ResponseEntity.ok(DtoMapper.toAddressDto(address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(id);
        return ResponseEntity.noContent().build();
    }
}
