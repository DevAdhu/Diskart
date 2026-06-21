package com.store.ecommerce.controller;

import com.store.ecommerce.dto.LoginRequestDto;
import com.store.ecommerce.dto.RegisterRequestDto;
import com.store.ecommerce.dto.UserDto;
import com.store.ecommerce.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(
            @RequestBody RegisterRequestDto request) {
        return ResponseEntity.ok(authService.register(request));
    }
}