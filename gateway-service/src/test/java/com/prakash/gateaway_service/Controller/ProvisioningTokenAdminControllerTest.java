package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.CreateProvisioningTokenResponseDto;
import com.prakash.gateaway_service.DTO.ProvisioningTokenResponseDto;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.JwtService;
import com.prakash.gateaway_service.Service.ProvisioningService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProvisioningTokenAdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ProvisioningTokenAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProvisioningService provisioningService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void listProvisioningTokensAsSuperAdmin() throws Exception {
        when(provisioningService.findAllProvisioningTokens()).thenReturn(List.of(safeResponse()));

        mockMvc.perform(get("/admin/provisioning-tokens"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Local Demo Provisioner"))
                .andExpect(jsonPath("$[0].defaultPlanName").value("FREE"))
                .andExpect(jsonPath("$[0].active").value(true))
                .andExpect(jsonPath("$[0].token").doesNotExist())
                .andExpect(jsonPath("$[0].rawToken").doesNotExist())
                .andExpect(jsonPath("$[0].tokenHash").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void listProvisioningTokensAsReadOnlyAdmin() throws Exception {
        when(provisioningService.findAllProvisioningTokens()).thenReturn(List.of(safeResponse()));

        mockMvc.perform(get("/admin/provisioning-tokens"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void createProvisioningTokenAsSuperAdmin() throws Exception {
        when(provisioningService.createProvisioningToken(any()))
                .thenReturn(new CreateProvisioningTokenResponseDto(
                        2L,
                        "Acme signup integration",
                        "prov_generated-secret",
                        "FREE",
                        true,
                        LocalDateTime.of(2026, 6, 22, 10, 20),
                        null
                ));

        mockMvc.perform(post("/admin/provisioning-tokens")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Acme signup integration",
                                  "defaultPlanName": "FREE"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Acme signup integration"))
                .andExpect(jsonPath("$.token", startsWith("prov_")))
                .andExpect(jsonPath("$.tokenHash").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void createProvisioningTokenAsReadOnlyAdminDenied() throws Exception {
        mockMvc.perform(post("/admin/provisioning-tokens")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Acme signup integration",
                                  "defaultPlanName": "FREE"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void disableProvisioningTokenAsSuperAdmin() throws Exception {
        when(provisioningService.disableProvisioningToken(2L))
                .thenReturn(new ProvisioningTokenResponseDto(
                        2L,
                        "Acme signup integration",
                        "FREE",
                        false,
                        LocalDateTime.of(2026, 6, 22, 10, 20),
                        null
                ));

        mockMvc.perform(patch("/admin/provisioning-tokens/2/disable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.tokenHash").doesNotExist());

        verify(provisioningService).disableProvisioningToken(2L);
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void disableProvisioningTokenAsReadOnlyAdminDenied() throws Exception {
        mockMvc.perform(patch("/admin/provisioning-tokens/2/disable"))
                .andExpect(status().isForbidden());
    }

    private ProvisioningTokenResponseDto safeResponse() {
        return new ProvisioningTokenResponseDto(
                1L,
                "Local Demo Provisioner",
                "FREE",
                true,
                LocalDateTime.of(2026, 6, 22, 10, 15, 30),
                null
        );
    }
}
