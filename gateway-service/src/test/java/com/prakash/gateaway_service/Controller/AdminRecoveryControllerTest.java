package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.AdminRecoveryResponseDto;
import com.prakash.gateaway_service.Exception.AdminRecoveryUnavailableException;
import com.prakash.gateaway_service.Exception.InvalidAdminRecoveryTokenException;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.AdminService;
import com.prakash.gateaway_service.Service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminRecoveryController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AdminRecoveryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminService adminService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    void recoveryDoesNotRequireJwtAndReturnsSafeResponse() throws Exception {
        when(adminService.recoverOwner(any(), eq("correct-token")))
                .thenReturn(new AdminRecoveryResponseDto("owner", "Owner", "Recovery admin is ready."));

        mockMvc.perform(post("/admin/recovery/owner")
                        .header("X-Admin-Recovery-Token", "correct-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "owner",
                                  "newPassword": "Coastal gateway passphrase 2026!",
                                  "confirmPassword": "Coastal gateway passphrase 2026!"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("owner"))
                .andExpect(jsonPath("$.role").value("Owner"))
                .andExpect(jsonPath("$.message").value("Recovery admin is ready."))
                .andExpect(jsonPath("$.newPassword").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist());

        verify(adminService).recoverOwner(any(), eq("correct-token"));
    }

    @Test
    void recoveryDisabledReturnsNotFound() throws Exception {
        when(adminService.recoverOwner(any(), eq("correct-token")))
                .thenThrow(new AdminRecoveryUnavailableException("Admin recovery is unavailable"));

        mockMvc.perform(post("/admin/recovery/owner")
                        .header("X-Admin-Recovery-Token", "correct-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newPassword": "Coastal gateway passphrase 2026!",
                                  "confirmPassword": "Coastal gateway passphrase 2026!"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Admin recovery is unavailable"));
    }

    @Test
    void wrongRecoveryTokenReturnsForbidden() throws Exception {
        when(adminService.recoverOwner(any(), eq("wrong-token")))
                .thenThrow(new InvalidAdminRecoveryTokenException("Invalid recovery token"));

        mockMvc.perform(post("/admin/recovery/owner")
                        .header("X-Admin-Recovery-Token", "wrong-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newPassword": "Coastal gateway passphrase 2026!",
                                  "confirmPassword": "Coastal gateway passphrase 2026!"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Invalid recovery token"));
    }
}
