package com.store.ecommerce.service;

import com.store.ecommerce.exception.ConflictException;
import com.store.ecommerce.exception.ResourceNotFoundException;
import com.store.ecommerce.model.User;
import com.store.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new ConflictException("Email already registered: " + user.getEmail());
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Resolves the currently authenticated user from the JWT-backed security
     * context. Never use a client-supplied user id for authorization decisions.
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || authentication.getPrincipal() == null) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user");
        }

        Object principal = authentication.getPrincipal();
        String email = principal instanceof UserDetails details
                ? details.getUsername()
                : principal.toString();
        return getUserByEmail(email);
    }

    /**
     * Used by web security expressions to allow "self" access to a user resource.
     */
    public boolean isCurrentUser(Long id) {
        if (id == null) {
            return false;
        }
        try {
            User current = getCurrentUser();
            return id.equals(current.getId());
        } catch (AuthenticationCredentialsNotFoundException | ResourceNotFoundException ex) {
            return false;
        }
    }
}
