package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.GatewaySettingsResponseDto;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.GatewaySettingsService;
import com.prakash.gateaway_service.Service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GatewaySettingsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class GatewaySettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GatewaySettingsService gatewaySettingsService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void getGatewaySettingsAsSuperAdmin() throws Exception {
        when(gatewaySettingsService.getGatewaySettings()).thenReturn(response());

        mockMvc.perform(get("/admin/settings/gateway"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upstreamBaseUrl").value("http://backend-service:8081"))
                .andExpect(jsonPath("$.healthCheckPath").value("/health"))
                .andExpect(jsonPath("$.timeoutMs").value(5000))
                .andExpect(jsonPath("$.updatedBy").value("system"));
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void getGatewaySettingsAsReadOnlyAdmin() throws Exception {
        when(gatewaySettingsService.getGatewaySettings()).thenReturn(response());

        mockMvc.perform(get("/admin/settings/gateway"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN", username = "super admin")
    void updateGatewaySettingsAsSuperAdmin() throws Exception {
        when(gatewaySettingsService.updateGatewaySettings(any())).thenReturn(new GatewaySettingsResponseDto(
                "https://api.example.com",
                "/status",
                8000,
                LocalDateTime.of(2026, 6, 23, 10, 30),
                "super admin"
        ));

        mockMvc.perform(put("/admin/settings/gateway")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "upstreamBaseUrl": "https://api.example.com",
                                  "healthCheckPath": "/status",
                                  "timeoutMs": 8000
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upstreamBaseUrl").value("https://api.example.com"))
                .andExpect(jsonPath("$.healthCheckPath").value("/status"))
                .andExpect(jsonPath("$.timeoutMs").value(8000))
                .andExpect(jsonPath("$.updatedBy").value("super admin"));

        verify(gatewaySettingsService).updateGatewaySettings(any());
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void updateGatewaySettingsAsReadOnlyAdminDenied() throws Exception {
        mockMvc.perform(put("/admin/settings/gateway")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "upstreamBaseUrl": "https://api.example.com",
                                  "healthCheckPath": "/status",
                                  "timeoutMs": 8000
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedGetGatewaySettingsDenied() throws Exception {
        mockMvc.perform(get("/admin/settings/gateway"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedUpdateGatewaySettingsDenied() throws Exception {
        mockMvc.perform(put("/admin/settings/gateway")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "upstreamBaseUrl": "https://api.example.com",
                                  "healthCheckPath": "/status",
                                  "timeoutMs": 8000
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    private GatewaySettingsResponseDto response() {
        return new GatewaySettingsResponseDto(
                "http://backend-service:8081",
                "/health",
                5000,
                LocalDateTime.of(2026, 6, 23, 10, 15),
                "system"
        );
    }
}
