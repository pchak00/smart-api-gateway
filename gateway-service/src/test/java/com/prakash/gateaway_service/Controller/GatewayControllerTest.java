package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.ClientApiKeyRotationResponseDto;
import com.prakash.gateaway_service.DTO.ClientMetadataResponseDto;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.AbuseDetectionService;
import com.prakash.gateaway_service.Service.ClientService;
import com.prakash.gateaway_service.Service.JwtService;
import com.prakash.gateaway_service.Service.PlanService;
import com.prakash.gateaway_service.Service.RouteLimitService;
import com.prakash.gateaway_service.Service.UsageLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GatewayController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class GatewayControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UsageLogService usageLogService;

    @MockitoBean
    private ClientService clientService;

    @MockitoBean
    private PlanService planService;

    @MockitoBean
    private RouteLimitService routeLimitService;

    @MockitoBean
    private AbuseDetectionService abuseDetectionService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    @WithMockUser(roles = "OWNER")
    void ownerCanRotateClientApiKey() throws Exception {
        when(clientService.rotateApiKey(42L)).thenReturn(rotationResponse());

        mockMvc.perform(post("/admin/clients/42/rotate-api-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.clientName").value("Acme"))
                .andExpect(jsonPath("$.apiKey", startsWith("new-api-key")))
                .andExpect(jsonPath("$.apiKey", not("old-api-key")))
                .andExpect(jsonPath("$.planName").value("FREE"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.rotatedAt").exists());

        verify(clientService).rotateApiKey(42L);
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void superAdminCanRotateClientApiKey() throws Exception {
        when(clientService.rotateApiKey(42L)).thenReturn(rotationResponse());

        mockMvc.perform(post("/admin/clients/42/rotate-api-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.apiKey").value("new-api-key-123"));

        verify(clientService).rotateApiKey(42L);
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void readOnlyAdminCannotRotateClientApiKey() throws Exception {
        mockMvc.perform(post("/admin/clients/42/rotate-api-key"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestCannotRotateClientApiKey() throws Exception {
        mockMvc.perform(post("/admin/clients/42/rotate-api-key"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "OWNER")
    void ownerCanDisableAndEnableClient() throws Exception {
        when(clientService.disableClient(42L))
                .thenReturn(new ClientMetadataResponseDto(42L, "Acme", false, "FREE"));
        when(clientService.enableClient(42L))
                .thenReturn(new ClientMetadataResponseDto(42L, "Acme", true, "FREE"));

        mockMvc.perform(patch("/admin/clients/42/disable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.apiKey").doesNotExist());

        mockMvc.perform(patch("/admin/clients/42/enable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.apiKey").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void superAdminCanDisableAndEnableClient() throws Exception {
        when(clientService.disableClient(42L))
                .thenReturn(new ClientMetadataResponseDto(42L, "Acme", false, "FREE"));
        when(clientService.enableClient(42L))
                .thenReturn(new ClientMetadataResponseDto(42L, "Acme", true, "FREE"));

        mockMvc.perform(patch("/admin/clients/42/disable"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/admin/clients/42/enable"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void readOnlyAdminCannotDisableOrEnableClient() throws Exception {
        mockMvc.perform(patch("/admin/clients/42/disable"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/admin/clients/42/enable"))
                .andExpect(status().isForbidden());
    }

    private ClientApiKeyRotationResponseDto rotationResponse() {
        return new ClientApiKeyRotationResponseDto(
                42L,
                "Acme",
                "new-api-key-123",
                "FREE",
                true,
                LocalDateTime.of(2026, 6, 25, 10, 30)
        );
    }
}
