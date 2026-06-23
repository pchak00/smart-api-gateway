package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.LoginResponseDto;
import com.prakash.gateaway_service.Entity.AdminRefreshToken;
import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.InvalidCredentialsException;
import com.prakash.gateaway_service.Repository.AdminRefreshTokenRepository;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.clearInvocations;

class AdminRefreshTokenServiceTest {

    private static final String JWT_SECRET = "myverysecuresecretkeymyverysecuresecretkey";

    private AdminRefreshTokenRepository adminRefreshTokenRepository;
    private AdminRefreshTokenService adminRefreshTokenService;
    private AdminRefreshToken savedSession;
    private AdminUser viewer;

    @BeforeEach
    void setUp() {
        adminRefreshTokenRepository = mock(AdminRefreshTokenRepository.class);
        JwtService jwtService = new JwtService(JWT_SECRET, 60_000);
        adminRefreshTokenService = new AdminRefreshTokenService(
                adminRefreshTokenRepository,
                jwtService,
                3_600_000
        );
        viewer = adminUser("viewer", AdminRole.READ_ONLY_ADMIN);

        when(adminRefreshTokenRepository.save(any(AdminRefreshToken.class))).thenAnswer(invocation -> {
            savedSession = invocation.getArgument(0);
            savedSession.setId(1L);
            return savedSession;
        });
    }

    @Test
    void createSessionReturnsAccessAndRefreshTokens() {
        LoginResponseDto response = adminRefreshTokenService.createSession(viewer);

        assertNotNull(response.token());
        assertNotNull(response.refreshToken());
        assertEquals("viewer", response.username());
        assertEquals(AdminRole.READ_ONLY_ADMIN, response.role());
        assertEquals(60_000, response.expiresInMs());
        assertEquals(viewer, savedSession.getAdminUser());
        assertNotEquals(response.refreshToken(), savedSession.getTokenHash());
    }

    @Test
    void refreshSessionReturnsNewAccessTokenWithSameAdminRole() {
        LoginResponseDto login = adminRefreshTokenService.createSession(viewer);
        when(adminRefreshTokenRepository.findByTokenHash(savedSession.getTokenHash()))
                .thenReturn(Optional.of(savedSession));

        LoginResponseDto refreshed = adminRefreshTokenService.refreshSession(login.refreshToken());

        assertNotNull(refreshed.token());
        assertEquals(login.refreshToken(), refreshed.refreshToken());
        assertEquals("viewer", refreshed.username());
        assertEquals(AdminRole.READ_ONLY_ADMIN, refreshed.role());
        assertEquals("READ_ONLY_ADMIN", tokenRole(refreshed.token()));
    }

    @Test
    void invalidRefreshTokenIsRejected() {
        when(adminRefreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class,
                () -> adminRefreshTokenService.refreshSession("admref_invalid"));
    }

    @Test
    void expiredRefreshTokenIsRejected() {
        AdminRefreshTokenService expiredService = new AdminRefreshTokenService(
                adminRefreshTokenRepository,
                new JwtService(JWT_SECRET, 60_000),
                -1_000
        );
        LoginResponseDto login = expiredService.createSession(viewer);
        when(adminRefreshTokenRepository.findByTokenHash(savedSession.getTokenHash()))
                .thenReturn(Optional.of(savedSession));

        assertThrows(InvalidCredentialsException.class,
                () -> expiredService.refreshSession(login.refreshToken()));
    }

    @Test
    void logoutRevokesRefreshToken() {
        LoginResponseDto login = adminRefreshTokenService.createSession(viewer);
        when(adminRefreshTokenRepository.findByTokenHash(savedSession.getTokenHash()))
                .thenReturn(Optional.of(savedSession));
        clearInvocations(adminRefreshTokenRepository);

        adminRefreshTokenService.revokeSession(login.refreshToken());

        assertNotNull(savedSession.getRevokedAt());
        verify(adminRefreshTokenRepository).save(savedSession);
    }

    private String tokenRole(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(JWT_SECRET.getBytes(StandardCharsets.UTF_8))
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    private AdminUser adminUser(String username, AdminRole role) {
        AdminUser adminUser = new AdminUser();
        adminUser.setId(1L);
        adminUser.setUsername(username);
        adminUser.setPassword("encoded-password");
        adminUser.setRole(role);
        return adminUser;
    }
}
