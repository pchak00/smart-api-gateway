package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.LoginRequestDto;
import com.prakash.gateaway_service.DTO.LoginResponseDto;
import com.prakash.gateaway_service.DTO.LogoutRequestDto;
import com.prakash.gateaway_service.DTO.RefreshTokenRequestDto;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.InvalidCredentialsException;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.AdminRefreshTokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminRefreshTokenService adminRefreshTokenService;

    public AuthController(AdminUserRepository adminUserRepository,
                          PasswordEncoder passwordEncoder,
                          AdminRefreshTokenService adminRefreshTokenService) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminRefreshTokenService = adminRefreshTokenService;
    }

    @PostMapping("/login")
    public LoginResponseDto login(@RequestBody LoginRequestDto request) {

        AdminUser admin = adminUserRepository.findByUsername(request.username())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        boolean passwordMatches = passwordEncoder.matches(
                request.password(),
                admin.getPassword()
        );

        if (!passwordMatches) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        return adminRefreshTokenService.createSession(admin);
    }

    @PostMapping("/refresh")
    public LoginResponseDto refresh(@RequestBody(required = false) RefreshTokenRequestDto request) {
        return adminRefreshTokenService.refreshSession(request == null ? null : request.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) LogoutRequestDto request) {
        if (request != null) {
            adminRefreshTokenService.revokeSession(request.refreshToken());
        }
        return ResponseEntity.noContent().build();
    }
}
