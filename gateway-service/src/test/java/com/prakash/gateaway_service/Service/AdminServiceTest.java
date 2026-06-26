package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.AdminDto;
import com.prakash.gateaway_service.DTO.UpdateAdminRoleDto;
import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.AdminRoleHierarchyException;
import com.prakash.gateaway_service.Exception.LastOwnerException;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminServiceTest {

    private AdminUserRepository adminUserRepository;
    private PasswordEncoder passwordEncoder;
    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminUserRepository = mock(AdminUserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        adminService = new AdminService(adminUserRepository, passwordEncoder);
        when(passwordEncoder.encode("password")).thenReturn("encoded-password");
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> {
            AdminUser adminUser = invocation.getArgument(0);
            if (adminUser.getId() == null) {
                adminUser.setId(10L);
            }
            return adminUser;
        });
    }

    @Test
    void ownerCanCreateSuperAdmin() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.existsByUsername("new-admin")).thenReturn(false);

        var response = adminService.createAdmin(
                new AdminDto("new-admin", "password", AdminRole.SUPER_ADMIN),
                "owner"
        );

        assertEquals(AdminRole.SUPER_ADMIN, response.role());
    }

    @Test
    void ownerCanCreateOwner() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.existsByUsername("second-owner")).thenReturn(false);

        var response = adminService.createAdmin(
                new AdminDto("second-owner", "password", AdminRole.OWNER),
                "owner"
        );

        assertEquals(AdminRole.OWNER, response.role());
    }

    @Test
    void superAdminCanCreateViewer() {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));
        when(adminUserRepository.existsByUsername("viewer")).thenReturn(false);

        var response = adminService.createAdmin(
                new AdminDto("viewer", "password", AdminRole.READ_ONLY_ADMIN),
                "admin"
        );

        assertEquals(AdminRole.READ_ONLY_ADMIN, response.role());
    }

    @Test
    void superAdminCannotCreateSuperAdmin() {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));

        assertThrows(AdminRoleHierarchyException.class, () -> adminService.createAdmin(
                new AdminDto("new-admin", "password", AdminRole.SUPER_ADMIN),
                "admin"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void readOnlyAdminCannotCreateAdminUsers() {
        when(adminUserRepository.findByUsername("viewer")).thenReturn(Optional.of(admin(3L, "viewer", AdminRole.READ_ONLY_ADMIN)));

        assertThrows(AdminRoleHierarchyException.class, () -> adminService.createAdmin(
                new AdminDto("new-viewer", "password", AdminRole.READ_ONLY_ADMIN),
                "viewer"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void ownerCanDemoteSuperAdmin() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        AdminUser target = admin(2L, "admin", AdminRole.SUPER_ADMIN);
        when(adminUserRepository.findById(2L)).thenReturn(Optional.of(target));

        var response = adminService.updateAdminRole(
                2L,
                new UpdateAdminRoleDto(AdminRole.READ_ONLY_ADMIN),
                "owner"
        );

        assertEquals(AdminRole.READ_ONLY_ADMIN, response.role());
    }

    @Test
    void superAdminCannotDemoteOwner() {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));
        when(adminUserRepository.findById(1L)).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));

        assertThrows(AdminRoleHierarchyException.class, () -> adminService.updateAdminRole(
                1L,
                new UpdateAdminRoleDto(AdminRole.READ_ONLY_ADMIN),
                "admin"
        ));
    }

    @Test
    void superAdminCannotDemoteAnotherSuperAdmin() {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));
        when(adminUserRepository.findById(4L)).thenReturn(Optional.of(admin(4L, "other-admin", AdminRole.SUPER_ADMIN)));

        assertThrows(AdminRoleHierarchyException.class, () -> adminService.updateAdminRole(
                4L,
                new UpdateAdminRoleDto(AdminRole.READ_ONLY_ADMIN),
                "admin"
        ));
    }

    @Test
    void superAdminCanDeleteViewer() {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));
        AdminUser viewer = admin(3L, "viewer", AdminRole.READ_ONLY_ADMIN);
        when(adminUserRepository.findById(3L)).thenReturn(Optional.of(viewer));

        adminService.deleteAdmin(3L, "admin");

        verify(adminUserRepository).delete(viewer);
    }

    @Test
    void readOnlyAdminCannotDeleteViewer() {
        when(adminUserRepository.findByUsername("viewer")).thenReturn(Optional.of(admin(3L, "viewer", AdminRole.READ_ONLY_ADMIN)));
        when(adminUserRepository.findById(5L)).thenReturn(Optional.of(admin(5L, "other-viewer", AdminRole.READ_ONLY_ADMIN)));

        assertThrows(AdminRoleHierarchyException.class, () -> adminService.deleteAdmin(5L, "viewer"));
    }

    @Test
    void lastOwnerCannotBeDeleted() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.findById(1L)).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.countByRole(AdminRole.OWNER)).thenReturn(1L);

        assertThrows(LastOwnerException.class, () -> adminService.deleteAdmin(1L, "owner"));
    }

    @Test
    void lastOwnerCannotBeDemoted() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.findById(1L)).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.countByRole(AdminRole.OWNER)).thenReturn(1L);

        assertThrows(LastOwnerException.class, () -> adminService.updateAdminRole(
                1L,
                new UpdateAdminRoleDto(AdminRole.SUPER_ADMIN),
                "owner"
        ));
    }

    private AdminUser admin(Long id, String username, AdminRole role) {
        AdminUser adminUser = new AdminUser();
        adminUser.setId(id);
        adminUser.setUsername(username);
        adminUser.setPassword("encoded-password");
        adminUser.setRole(role);
        return adminUser;
    }
}
