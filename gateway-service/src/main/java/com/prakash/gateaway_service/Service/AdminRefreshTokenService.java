package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.LoginResponseDto;
import com.prakash.gateaway_service.Entity.AdminRefreshToken;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.InvalidCredentialsException;
import com.prakash.gateaway_service.Repository.AdminRefreshTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class AdminRefreshTokenService {
    private static final int TOKEN_RANDOM_BYTE_COUNT = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AdminRefreshTokenRepository adminRefreshTokenRepository;
    private final JwtService jwtService;
    private final long expirationMs;

    public AdminRefreshTokenService(
            AdminRefreshTokenRepository adminRefreshTokenRepository,
            JwtService jwtService,
            @Value("${admin.refresh-token.expiration-ms}") long expirationMs
    ) {
        this.adminRefreshTokenRepository = adminRefreshTokenRepository;
        this.jwtService = jwtService;
        this.expirationMs = expirationMs;
    }

    @Transactional
    public LoginResponseDto createSession(AdminUser adminUser) {
        String refreshToken = generateRawToken();
        LocalDateTime now = LocalDateTime.now();
        AdminRefreshToken session = new AdminRefreshToken();
        session.setAdminUser(adminUser);
        session.setTokenHash(hash(refreshToken));
        session.setCreatedAt(now);
        session.setExpiresAt(now.plus(Duration.ofMillis(expirationMs)));
        adminRefreshTokenRepository.save(session);

        return response(adminUser, refreshToken);
    }

    @Transactional
    public LoginResponseDto refreshSession(String refreshToken) {
        AdminRefreshToken session = findUsableSession(refreshToken);
        return response(session.getAdminUser(), refreshToken);
    }

    @Transactional
    public void revokeSession(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        adminRefreshTokenRepository.findByTokenHash(hash(refreshToken))
                .filter(session -> session.getRevokedAt() == null)
                .ifPresent(session -> {
                    session.setRevokedAt(LocalDateTime.now());
                    adminRefreshTokenRepository.save(session);
                });
    }

    private AdminRefreshToken findUsableSession(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidCredentialsException("Invalid or expired refresh token");
        }

        AdminRefreshToken session = adminRefreshTokenRepository.findByTokenHash(hash(refreshToken))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid or expired refresh token"));

        if (session.getRevokedAt() != null || !session.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new InvalidCredentialsException("Invalid or expired refresh token");
        }

        return session;
    }

    private LoginResponseDto response(AdminUser adminUser, String refreshToken) {
        return new LoginResponseDto(
                jwtService.generateToken(adminUser),
                refreshToken,
                adminUser.getUsername(),
                adminUser.getRole(),
                jwtService.getExpirationMs()
        );
    }

    private String generateRawToken() {
        byte[] randomBytes = new byte[TOKEN_RANDOM_BYTE_COUNT];
        SECURE_RANDOM.nextBytes(randomBytes);
        return "admref_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
