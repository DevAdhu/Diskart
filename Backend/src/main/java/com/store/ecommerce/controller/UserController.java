package com.store.ecommerce.controller;

import com.store.ecommerce.dto.DtoMapper;
import com.store.ecommerce.dto.UserDto;
import com.store.ecommerce.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(DtoMapper.toUserDto(userService.getUserById(id)));
    }

    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers()
            .stream().map(DtoMapper::toUserDto).toList();
    }
}