package com.store.ecommerce.service;

import com.store.ecommerce.dto.AddressRequest;
import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.Address;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.AddressRepository;
import com.store.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    @Mock
    private AddressRepository addressRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AddressService addressService;

    @BeforeEach
    void setUp() {
        UserService userService = new UserService(userRepository, passwordEncoder);
        addressService = new AddressService(addressRepository, userService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "password",
                        List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));
    }

    private static User user(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setName("Buyer");
        user.setEmail(email);
        user.setRole(User.Role.CUSTOMER);
        return user;
    }

    private static Address address(Long id, User owner, boolean isDefault) {
        Address address = new Address();
        address.setId(id);
        address.setUser(owner);
        address.setLine1("1 Main St");
        address.setCity("Delhi");
        address.setPostalCode("110001");
        address.setCountry("India");
        address.setDefault(isDefault);
        return address;
    }

    @Test
    void ownerCanReadOwnAddress() {
        User buyer = user(7L, "buyer@example.com");
        authenticate("buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(buyer));
        Address own = address(1L, buyer, false);
        when(addressRepository.findById(1L)).thenReturn(Optional.of(own));

        assertThat(addressService.getOwnedAddress(1L)).isSameAs(own);
    }

    @Test
    void anotherUsersAddressIsRejectedWithoutLeakingIt() {
        User buyer = user(7L, "buyer@example.com");
        User stranger = user(8L, "stranger@example.com");
        authenticate("buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(buyer));
        when(addressRepository.findById(2L)).thenReturn(Optional.of(address(2L, stranger, false)));

        assertThatThrownBy(() -> addressService.getOwnedAddress(2L))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void missingAddressThrowsNotFound() {
        authenticate("buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com"))
                .thenReturn(Optional.of(user(7L, "buyer@example.com")));
        when(addressRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.getOwnedAddress(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void settingDefaultClearsPreviousDefaultForSameUser() {
        User buyer = user(7L, "buyer@example.com");
        authenticate("buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(buyer));

        Address previousDefault = address(1L, buyer, true);
        when(addressRepository.findByUserIdOrderByIsDefaultDescIdAsc(7L))
                .thenReturn(List.of(previousDefault));
        when(addressRepository.save(any(Address.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AddressRequest request = new AddressRequest();
        request.setLine1("2 Second St");
        request.setCity("Mumbai");
        request.setPostalCode("400001");
        request.setCountry("India");
        request.setIsDefault(true);

        Address created = addressService.createAddress(request);

        assertThat(previousDefault.isDefault()).isFalse();
        assertThat(created.isDefault()).isTrue();
        verify(addressRepository).save(previousDefault);
        ArgumentCaptor<Address> captor = ArgumentCaptor.forClass(Address.class);
        verify(addressRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        assertThat(captor.getAllValues()).anyMatch(Address::isDefault);
    }

    @Test
    void deletingSomeoneElsesAddressIsRejected() {
        User buyer = user(7L, "buyer@example.com");
        User stranger = user(8L, "stranger@example.com");
        authenticate("buyer@example.com");
        when(userRepository.findByEmail("buyer@example.com")).thenReturn(Optional.of(buyer));
        when(addressRepository.findById(3L)).thenReturn(Optional.of(address(3L, stranger, false)));

        assertThatThrownBy(() -> addressService.deleteAddress(3L))
                .isInstanceOf(AccessDeniedException.class);
        verify(addressRepository, never()).delete(any(Address.class));
    }
}
