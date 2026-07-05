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
    private static final String STRONG_PASSWORD = "Coastal gateway passphrase 2026!";
    private static final String RECOVERY_PASSWORD = "river market quartz transit 2026";

    private AdminUserRepository adminUserRepository;
    private PasswordEncoder passwordEncoder;
    private AdminPasswordPolicy adminPasswordPolicy;
    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminUserRepository = mock(AdminUserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        adminPasswordPolicy = new AdminPasswordPolicy();
        adminService = new AdminService(adminUserRepository, passwordEncoder, adminPasswordPolicy, "");
        when(passwordEncoder.encode(STRONG_PASSWORD)).thenReturn("encoded-strong-password");
        when(passwordEncoder.encode(RECOVERY_PASSWORD)).thenReturn("encoded-recovery-password");
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
                new AdminDto("new-admin", STRONG_PASSWORD, AdminRole.SUPER_ADMIN),
                "owner"
        );

        assertEquals(AdminRole.SUPER_ADMIN, response.role());
    }

    @Test
    void ownerCanCreateOwner() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.existsByUsername("second-owner")).thenReturn(false);

        var response = adminService.createAdmin(
                new AdminDto("second-owner", STRONG_PASSWORD, AdminRole.OWNER),
                "owner"
        );

        assertEquals(AdminRole.OWNER, response.role());
    }

    @Test
    void superAdminCanCreateViewer() {
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));
        when(adminUserRepository.existsByUsername("viewer")).thenReturn(false);

        var response = adminService.createAdmin(
                new AdminDto("viewer", STRONG_PASSWORD, AdminRole.READ_ONLY_ADMIN),
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
    void createAdminRejectsWeakPassword() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.existsByUsername("new-admin")).thenReturn(false);

        assertThrows(InvalidAdminPasswordException.class, () -> adminService.createAdmin(
                new AdminDto("new-admin", "admin123", AdminRole.SUPER_ADMIN),
                "owner"
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
                new AdminPasswordResetRequestDto(STRONG_PASSWORD, STRONG_PASSWORD),
                "owner"
        );

        assertEquals("encoded-strong-password", target.getPassword());
        verify(adminUserRepository).save(target);
    }

    @Test
    void readOnlyAdminCannotResetPassword() {
        when(adminUserRepository.findByUsername("viewer")).thenReturn(Optional.of(admin(3L, "viewer", AdminRole.READ_ONLY_ADMIN)));
        when(adminUserRepository.findById(5L)).thenReturn(Optional.of(admin(5L, "other-viewer", AdminRole.READ_ONLY_ADMIN)));

        assertThrows(AdminRoleHierarchyException.class, () -> adminService.resetAdminPassword(
                5L,
                new AdminPasswordResetRequestDto(STRONG_PASSWORD, STRONG_PASSWORD),
                "viewer"
        ));

        verify(passwordEncoder, never()).encode(STRONG_PASSWORD);
        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void passwordResetRejectsMismatchedConfirmation() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.findById(2L)).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));

        assertThrows(InvalidAdminPasswordException.class, () -> adminService.resetAdminPassword(
                2L,
                new AdminPasswordResetRequestDto(STRONG_PASSWORD, "different"),
                "owner"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void passwordResetRejectsWeakPassword() {
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.of(admin(1L, "owner", AdminRole.OWNER)));
        when(adminUserRepository.findById(2L)).thenReturn(Optional.of(admin(2L, "admin", AdminRole.SUPER_ADMIN)));

        assertThrows(InvalidAdminPasswordException.class, () -> adminService.resetAdminPassword(
                2L,
                new AdminPasswordResetRequestDto("12345678", "12345678"),
                "owner"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void emergencyRecoveryIsDisabledWhenTokenUnset() {
        assertThrows(AdminRecoveryUnavailableException.class, () -> adminService.recoverOwner(
                new AdminRecoveryRequestDto("owner", RECOVERY_PASSWORD, RECOVERY_PASSWORD),
                "token"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void emergencyRecoveryRejectsWrongToken() {
        AdminService recoveryService = new AdminService(adminUserRepository, passwordEncoder, adminPasswordPolicy, "correct-token");

        assertThrows(InvalidAdminRecoveryTokenException.class, () -> recoveryService.recoverOwner(
                new AdminRecoveryRequestDto("owner", RECOVERY_PASSWORD, RECOVERY_PASSWORD),
                "wrong-token"
        ));

        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void emergencyRecoveryCreatesOwnerWithCorrectToken() {
        AdminService recoveryService = new AdminService(adminUserRepository, passwordEncoder, adminPasswordPolicy, "correct-token");
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.empty());

        var response = recoveryService.recoverOwner(
                new AdminRecoveryRequestDto(null, RECOVERY_PASSWORD, RECOVERY_PASSWORD),
                "correct-token"
        );

        assertEquals("owner", response.username());
        assertEquals("Owner", response.role());
        verify(adminUserRepository).save(any(AdminUser.class));
    }

    @Test
    void emergencyRecoveryResetsExistingAdminAndPromotesToOwner() {
        AdminService recoveryService = new AdminService(adminUserRepository, passwordEncoder, adminPasswordPolicy, "correct-token");
        AdminUser admin = admin(2L, "admin", AdminRole.READ_ONLY_ADMIN);
        when(adminUserRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        var response = recoveryService.recoverOwner(
                new AdminRecoveryRequestDto("admin", RECOVERY_PASSWORD, RECOVERY_PASSWORD),
                "correct-token"
        );

        assertEquals("admin", response.username());
        assertEquals(AdminRole.OWNER, admin.getRole());
        assertEquals("encoded-recovery-password", admin.getPassword());
    }

    @Test
    void emergencyRecoveryRejectsWeakPasswordWithCorrectToken() {
        AdminService recoveryService = new AdminService(adminUserRepository, passwordEncoder, adminPasswordPolicy, "correct-token");
        when(adminUserRepository.findByUsername("owner")).thenReturn(Optional.empty());

        assertThrows(InvalidAdminPasswordException.class, () -> recoveryService.recoverOwner(
                new AdminRecoveryRequestDto("owner", "owner123456789", "owner123456789"),
                "correct-token"
        ));

        verify(adminUserRepository, never()).save(any());
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
