package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.LoginResponseDto;
import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.InvalidCredentialsException;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.AdminRefreshTokenService;
import com.prakash.gateaway_service.Service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private AdminRefreshTokenService adminRefreshTokenService;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void loginReturnsRefreshCapability() throws Exception {
        AdminUser admin = adminUser("super admin", AdminRole.SUPER_ADMIN);
        when(adminUserRepository.findByUsername("super admin")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("admin123", "encoded-password")).thenReturn(true);
        when(adminRefreshTokenService.createSession(admin))
                .thenReturn(new LoginResponseDto(
                        "access-token",
                        "refresh-token",
                        "super admin",
                        AdminRole.SUPER_ADMIN,
                        60_000
                ));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "super admin",
                                  "password": "admin123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
                .andExpect(jsonPath("$.username").value("super admin"))
                .andExpect(jsonPath("$.role").value("SUPER_ADMIN"))
                .andExpect(jsonPath("$.expiresInMs").value(60_000));
    }

    @Test
    void ownerLoginWorks() throws Exception {
        AdminUser owner = adminUser("owner", AdminRole.OWNER);
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(owner));
        when(passwordEncoder.matches("admin123", "encoded-password")).thenReturn(true);
        when(adminRefreshTokenService.createSession(owner))
                .thenReturn(new LoginResponseDto(
                        "owner-access-token",
                        "owner-refresh-token",
                        "owner",
                        AdminRole.OWNER,
                        60_000
                ));

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "owner",
                                  "password": "admin123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("owner"))
                .andExpect(jsonPath("$.role").value("OWNER"));
    }

    @Test
    void refreshReturnsNewAccessToken() throws Exception {
        when(adminRefreshTokenService.refreshSession("refresh-token"))
                .thenReturn(new LoginResponseDto(
                        "new-access-token",
                        "refresh-token",
                        "viewer",
                        AdminRole.READ_ONLY_ADMIN,
                        60_000
                ));

        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "refresh-token"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new-access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
                .andExpect(jsonPath("$.username").value("viewer"))
                .andExpect(jsonPath("$.role").value("READ_ONLY_ADMIN"));
    }

    @Test
    void refreshPreservesOwnerRole() throws Exception {
        when(adminRefreshTokenService.refreshSession("owner-refresh-token"))
                .thenReturn(new LoginResponseDto(
                        "owner-access-token",
                        "owner-refresh-token",
                        "owner",
                        AdminRole.OWNER,
                        60_000
                ));

        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "owner-refresh-token"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("owner"))
                .andExpect(jsonPath("$.role").value("OWNER"));
    }

    @Test
    void invalidRefreshTokenReturnsUnauthorized() throws Exception {
        when(adminRefreshTokenService.refreshSession("bad-refresh-token"))
                .thenThrow(new InvalidCredentialsException("Invalid or expired refresh token"));

        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "bad-refresh-token"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid or expired refresh token"));
    }

    @Test
    void logoutRevokesRefreshToken() throws Exception {
        mockMvc.perform(post("/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "refresh-token"
                                }
                                """))
                .andExpect(status().isNoContent());
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
