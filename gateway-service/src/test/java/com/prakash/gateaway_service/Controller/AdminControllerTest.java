package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.Config.SecurityConfig;
import com.prakash.gateaway_service.DTO.AdminResponseDto;
import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Filter.JwtAuthenticationFilter;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import com.prakash.gateaway_service.Service.AdminService;
import com.prakash.gateaway_service.Service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminService adminService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @Test
    @WithMockUser(username = "owner", roles = "OWNER")
    void ownerCanCreateAdminUser() throws Exception {
        when(adminService.createAdmin(any(), eq("owner")))
                .thenReturn(new AdminResponseDto(10L, "new-admin", AdminRole.SUPER_ADMIN));

        mockMvc.perform(post("/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "new-admin",
                                  "password": "admin123",
                                  "role": "SUPER_ADMIN"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("SUPER_ADMIN"));

        verify(adminService).createAdmin(any(), eq("owner"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "SUPER_ADMIN")
    void superAdminCanCreateAdminUserSubjectToServiceHierarchy() throws Exception {
        when(adminService.createAdmin(any(), eq("admin")))
                .thenReturn(new AdminResponseDto(11L, "viewer", AdminRole.READ_ONLY_ADMIN));

        mockMvc.perform(post("/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "viewer",
                                  "password": "admin123",
                                  "role": "READ_ONLY_ADMIN"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("READ_ONLY_ADMIN"));

        verify(adminService).createAdmin(any(), eq("admin"));
    }

    @Test
    @WithMockUser(roles = "READ_ONLY_ADMIN")
    void readOnlyAdminCannotCreateAdminUser() throws Exception {
        mockMvc.perform(post("/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "viewer",
                                  "password": "admin123",
                                  "role": "READ_ONLY_ADMIN"
                                }
                                """))
                .andExpect(status().isForbidden());

        verify(adminService, never()).createAdmin(any(), any());
    }

    @Test
    @WithMockUser(username = "owner", roles = "OWNER")
    void ownerCanUpdateAdminRole() throws Exception {
        when(adminService.updateAdminRole(eq(2L), any(), eq("owner")))
                .thenReturn(new AdminResponseDto(2L, "admin", AdminRole.READ_ONLY_ADMIN));

        mockMvc.perform(patch("/admin/users/2/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "role": "READ_ONLY_ADMIN"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("READ_ONLY_ADMIN"));

        verify(adminService).updateAdminRole(eq(2L), any(), eq("owner"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "SUPER_ADMIN")
    void superAdminCanDeleteAdminUserSubjectToServiceHierarchy() throws Exception {
        mockMvc.perform(delete("/admin/users/3"))
                .andExpect(status().isNoContent());

        verify(adminService).deleteAdmin(3L, "admin");
    }

    @Test
    @WithMockUser(username = "owner", roles = "OWNER")
    void ownerCanResetAdminPassword() throws Exception {
        mockMvc.perform(patch("/admin/users/2/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newPassword": "new-password",
                                  "confirmPassword": "new-password"
                                }
                                """))
                .andExpect(status().isNoContent());

        verify(adminService).resetAdminPassword(eq(2L), any(), eq("owner"));
    }

    @Test
    @WithMockUser(username = "viewer", roles = "READ_ONLY_ADMIN")
    void readOnlyAdminCannotResetAdminPassword() throws Exception {
        mockMvc.perform(patch("/admin/users/2/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newPassword": "new-password",
                                  "confirmPassword": "new-password"
                                }
                                """))
                .andExpect(status().isForbidden());

        verify(adminService, never()).resetAdminPassword(any(), any(), any());
    }
}
