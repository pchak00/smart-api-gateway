package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.AdminDto;
import com.prakash.gateaway_service.DTO.AdminPasswordResetRequestDto;
import com.prakash.gateaway_service.DTO.AdminRecoveryRequestDto;
import com.prakash.gateaway_service.DTO.UpdateAdminRoleDto;
import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.AdminRoleHierarchyException;
import com.prakash.gateaway_service.Exception.AdminRecoveryUnavailableException;
import com.prakash.gateaway_service.Exception.InvalidAdminPasswordException;
import com.prakash.gateaway_service.Exception.InvalidAdminRecoveryTokenException;
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
        adminService = new AdminService(adminUserRepository, passwordEncoder, "");
        when(passwordEncoder.encode("password")).thenReturn("encoded-password");
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new-password");
        when(passwordEncoder.encode("recovered-password")).thenReturn("encoded-recovered-password");
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

    @Test
    void ownerCanResetAdminPassword() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        AdminUser target = admin(2L, "admin", AdminRole.SUPER_ADMIN);
        when(adminUserRepository.findById(2L)).thenReturn(Optional.of(target));

        adminService.resetAdminPassword(
                2L,
                new AdminPasswordResetRequestDto("new-password", "new-password"),
                "owner"
        );

        assertEquals("encoded-new-password", target.getPassword());
        verify(adminUserRepository).save(target);
    }

    @Test
    void readOnlyAdminCannotResetPassword() {
        when(adminUserRepository.findByUsername("viewer")).thenReturn(Optional.of(admin(3L, "viewer", AdminRole.READ_ONLY_ADMIN)));
        when(adminUserRepository.findById(5L)).thenReturn(Optional.of(admin(5L, "other-viewer", AdminRole.READ_ONLY_ADMIN)));

        assertThrows(AdminRoleHierarchyException.class, () -> adminService.resetAdminPassword(
                5L,
                new AdminPasswordResetRequestDto("new-password", "new-password"),
                "viewer"
        ));

        verify(passwordEncoder, never()).encode("new-password");
        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void passwordResetRejectsMismatchedConfirmation() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.findById(2L)).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));

        assertThrows(InvalidAdminPasswordException.class, () -> adminService.resetAdminPassword(
                2L,
                new AdminPasswordResetRequestDto("new-password", "different"),
                "owner"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void emergencyRecoveryIsDisabledWhenTokenUnset() {
        assertThrows(AdminRecoveryUnavailableException.class, () -> adminService.recoverOwner(
                new AdminRecoveryRequestDto("owner", "recovered-password", "recovered-password"),
                "token"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void emergencyRecoveryRejectsWrongToken() {
        AdminService recoveryService = new AdminService(adminUserRepository, passwordEncoder, "correct-token");

        assertThrows(InvalidAdminRecoveryTokenException.class, () -> recoveryService.recoverOwner(
                new AdminRecoveryRequestDto("owner", "recovered-password", "recovered-password"),
                "wrong-token"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void emergencyRecoveryCreatesOwnerWithCorrectToken() {
        AdminService recoveryService = new AdminService(adminUserRepository, passwordEncoder, "correct-token");
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.empty());

        var response = recoveryService.recoverOwner(
                new AdminRecoveryRequestDto(null, "recovered-password", "recovered-password"),
                "correct-token"
        );

        assertEquals("owner", response.username());
        assertEquals("Owner", response.role());
        verify(adminUserRepository).save(any(AdminUser.class));
    }

    @Test
    void emergencyRecoveryResetsExistingAdminAndPromotesToOwner() {
        AdminService recoveryService = new AdminService(adminUserRepository, passwordEncoder, "correct-token");
        AdminUser admin = admin(2L, "admin", AdminRole.READ_ONLY_ADMIN);
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        var response = recoveryService.recoverOwner(
                new AdminRecoveryRequestDto("admin", "recovered-password", "recovered-password"),
                "correct-token"
        );

        assertEquals("admin", response.username());
        assertEquals(AdminRole.OWNER, admin.getRole());
        assertEquals("encoded-recovered-password", admin.getPassword());
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
