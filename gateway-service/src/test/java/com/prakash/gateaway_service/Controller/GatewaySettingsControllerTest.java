package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.GatewaySettingsResponseDto;
import com.prakash.gateaway_service.DTO.TestGatewayConnectionResponseDto;
import com.prakash.gateaway_service.Exception.InvalidGatewaySettingsException;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.GatewayConnectionTestService;
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
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    private GatewayConnectionTestService gatewayConnectionTestService;

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
    @WithMockUser(roles = "OWNER", username = "owner")
    void updateGatewaySettingsAsOwner() throws Exception {
        when(gatewaySettingsService.updateGatewaySettings(any())).thenReturn(new GatewaySettingsResponseDto(
                "https://api.example.com",
                "/status",
                8000,
                LocalDateTime.of(2026, 6, 23, 10, 30),
                "owner"
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
                .andExpect(jsonPath("$.updatedBy").value("owner"));

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

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void testGatewayConnectionAsSuperAdmin() throws Exception {
        when(gatewayConnectionTestService.testConnection(any())).thenReturn(connectionResponse());

        mockMvc.perform(post("/admin/settings/gateway/test-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "upstreamBaseUrl": "http://backend-service:8081",
                                  "healthCheckPath": "/health",
                                  "timeoutMs": 5000
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reachable").value(true))
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.checkedUrl").value("http://backend-service:8081/health"))
                .andExpect(jsonPath("$.message").value("Upstream is reachable"));

        verify(gatewayConnectionTestService).testConnection(any());
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void testGatewayConnectionAsReadOnlyAdmin() throws Exception {
        when(gatewayConnectionTestService.testConnection(any())).thenReturn(connectionResponse());

        mockMvc.perform(post("/admin/settings/gateway/test-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "upstreamBaseUrl": "http://backend-service:8081",
                                  "healthCheckPath": "/health",
                                  "timeoutMs": 5000
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void testGatewayConnectionWithEmptyBody() throws Exception {
        when(gatewayConnectionTestService.testConnection(isNull())).thenReturn(connectionResponse());

        mockMvc.perform(post("/admin/settings/gateway/test-connection"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reachable").value(true));

        verify(gatewayConnectionTestService).testConnection(null);
    }

    @Test
    void unauthenticatedTestGatewayConnectionDenied() throws Exception {
        mockMvc.perform(post("/admin/settings/gateway/test-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "upstreamBaseUrl": "http://backend-service:8081",
                                  "healthCheckPath": "/health",
                                  "timeoutMs": 5000
                                }
                                """))
                .andExpect(status().isForbidden());

        verify(gatewayConnectionTestService, never()).testConnection(any());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void invalidGatewayConnectionRequestReturnsBadRequest() throws Exception {
        when(gatewayConnectionTestService.testConnection(any()))
                .thenThrow(new InvalidGatewaySettingsException("Upstream base URL must use http or https"));

        mockMvc.perform(post("/admin/settings/gateway/test-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "upstreamBaseUrl": "file:///etc/passwd",
                                  "healthCheckPath": "/health",
                                  "timeoutMs": 5000
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Upstream base URL must use http or https"));
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

    private TestGatewayConnectionResponseDto connectionResponse() {
        return new TestGatewayConnectionResponseDto(
                true,
                200,
                "http://backend-service:8081/health",
                42,
                "Upstream is reachable"
        );
    }
}
