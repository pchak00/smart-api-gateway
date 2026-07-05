package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.AdminDto;
import com.prakash.gateaway_service.DTO.AdminPasswordResetRequestDto;
import com.prakash.gateaway_service.DTO.AdminRecoveryRequestDto;
import com.prakash.gateaway_service.DTO.AdminRecoveryResponseDto;
import com.prakash.gateaway_service.DTO.AdminResponseDto;
import com.prakash.gateaway_service.DTO.UpdateAdminRoleDto;
import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.AdminRecoveryUnavailableException;
import com.prakash.gateaway_service.Exception.AdminNotFoundException;
import com.prakash.gateaway_service.Exception.AdminRoleHierarchyException;
import com.prakash.gateaway_service.Exception.DuplicateAdminException;
import com.prakash.gateaway_service.Exception.InvalidAdminPasswordException;
import com.prakash.gateaway_service.Exception.InvalidAdminRecoveryTokenException;
import com.prakash.gateaway_service.Exception.LastOwnerException;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;

@Service
public class AdminService {
    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final String DEFAULT_RECOVERY_USERNAME = "owner";

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminRecoveryToken;

    public AdminService(AdminUserRepository adminUserRepository,
                        PasswordEncoder passwordEncoder,
                        @Value("${admin.recovery.token:}") String adminRecoveryToken) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminRecoveryToken = adminRecoveryToken == null ? "" : adminRecoveryToken;
    }
    @Transactional
    public AdminResponseDto createAdmin(AdminDto request, String actorUsername) {
        AdminUser actor = findActor(actorUsername);
        assertCanCreate(actor, request.role());

        if (adminUserRepository.existsByUsername(request.username())) {
            throw new DuplicateAdminException(
                    "Admin already exists with username: " + request.username()
            );
        }

        AdminUser admin = new AdminUser();
        admin.setUsername(request.username());
        admin.setPassword(passwordEncoder.encode(request.password()));
        admin.setRole(request.role());

        AdminUser saved = adminUserRepository.save(admin);

        return AdminResponseDto.from(saved);
    }

    public List<AdminResponseDto> findAllAdmins() {
        return adminUserRepository.findAll()
                .stream()
                .map(AdminResponseDto::from)
                .toList();
    }

    @Transactional
    public void deleteAdmin(Long adminId, String actorUsername) {
        AdminUser actor = findActor(actorUsername);
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() ->
                        new AdminNotFoundException("Admin not found with id: " + adminId));

        assertCanManage(actor, admin);
        assertNotRemovingLastOwner(admin.getRole(), null, "At least one owner must remain.");

        adminUserRepository.delete(admin);
    }

    @Transactional
    public AdminResponseDto updateAdminRole(Long adminId, UpdateAdminRoleDto request, String actorUsername) {
        AdminUser actor = findActor(actorUsername);
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() ->
                        new AdminNotFoundException("Admin not found with id: " + adminId));

        assertCanManage(actor, admin);
        assertCanAssign(actor, request.role());
        assertNotRemovingLastOwner(admin.getRole(), request.role(), "At least one owner must remain.");

        admin.setRole(request.role());

        AdminUser saved = adminUserRepository.save(admin);

        return AdminResponseDto.from(saved);
    }

    @Transactional
    public void resetAdminPassword(Long adminId, AdminPasswordResetRequestDto request, String actorUsername) {
        AdminUser actor = findActor(actorUsername);
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() ->
                        new AdminNotFoundException("Admin not found with id: " + adminId));

        assertCanManage(actor, admin);
        String newPassword = validatePasswordReset(request);

        admin.setPassword(passwordEncoder.encode(newPassword));
        adminUserRepository.save(admin);

        log.info("Admin recovery action={} actorUsername={} actorId={} targetUsername={} targetId={} timestamp={}",
                "ADMIN_PASSWORD_RESET",
                actor.getUsername(),
                actor.getId(),
                admin.getUsername(),
                admin.getId(),
                Instant.now());
    }

    @Transactional
    public AdminRecoveryResponseDto recoverOwner(AdminRecoveryRequestDto request, String providedRecoveryToken) {
        assertValidRecoveryToken(providedRecoveryToken);

        String username = normalizeRecoveryUsername(request == null ? null : request.username());
        String newPassword = validateRecoveryPassword(request);
        AdminUser admin = adminUserRepository.findByUsername(username)
                .orElseGet(AdminUser::new);
        boolean created = admin.getId() == null;

        admin.setUsername(username);
        admin.setPassword(passwordEncoder.encode(newPassword));
        admin.setRole(AdminRole.OWNER);

        AdminUser saved = adminUserRepository.save(admin);

        log.warn("Admin recovery action={} resultUsername={} resultAdminId={} created={} timestamp={}",
                "EMERGENCY_OWNER_RECOVERY",
                saved.getUsername(),
                saved.getId(),
                created,
                Instant.now());

        return new AdminRecoveryResponseDto(saved.getUsername(), "Owner", "Recovery admin is ready.");
    }

    private AdminUser findActor(String username) {
        return adminUserRepository.findByUsername(username)
                .orElseThrow(() ->
                        new AdminNotFoundException("Admin not found with username: " + username));
    }

    private void assertCanCreate(AdminUser actor, AdminRole requestedRole) {
        assertCanAssign(actor, requestedRole);
    }

    private void assertCanManage(AdminUser actor, AdminUser target) {
        if (actor.getRole() == AdminRole.OWNER) {
            return;
        }

        if (actor.getRole() == AdminRole.SUPER_ADMIN && target.getRole() == AdminRole.READ_ONLY_ADMIN) {
            return;
        }

        throw new AdminRoleHierarchyException("You do not have permission to manage this admin user");
    }

    private void assertCanAssign(AdminUser actor, AdminRole requestedRole) {
        if (requestedRole == null) {
            throw new AdminRoleHierarchyException("Admin role is required");
        }

        if (actor.getRole() == AdminRole.OWNER) {
            return;
        }

        if (actor.getRole() == AdminRole.SUPER_ADMIN && requestedRole == AdminRole.READ_ONLY_ADMIN) {
            return;
        }

        throw new AdminRoleHierarchyException("You do not have permission to assign this admin role");
    }

    private void assertNotRemovingLastOwner(AdminRole currentRole, AdminRole requestedRole, String message) {
        boolean removingOwner = currentRole == AdminRole.OWNER && requestedRole != AdminRole.OWNER;

        if (removingOwner && adminUserRepository.countByRole(AdminRole.OWNER) <= 1) {
            throw new LastOwnerException(message);
        }
    }

    private String validatePasswordReset(AdminPasswordResetRequestDto request) {
        if (request == null) {
            throw new InvalidAdminPasswordException("New password is required");
        }

        return validatePassword(request.newPassword(), request.confirmPassword());
    }

    private String validateRecoveryPassword(AdminRecoveryRequestDto request) {
        if (request == null) {
            throw new InvalidAdminPasswordException("New password is required");
        }

        return validatePassword(request.newPassword(), request.confirmPassword());
    }

    private String validatePassword(String newPassword, String confirmPassword) {
        if (newPassword == null || newPassword.isBlank()) {
            throw new InvalidAdminPasswordException("New password is required");
        }

        if (newPassword.length() < MIN_PASSWORD_LENGTH) {
            throw new InvalidAdminPasswordException("New password must be at least 8 characters");
        }

        if (confirmPassword != null && !newPassword.equals(confirmPassword)) {
            throw new InvalidAdminPasswordException("Password confirmation does not match");
        }

        return newPassword;
    }

    private String normalizeRecoveryUsername(String username) {
        if (username == null || username.isBlank()) {
            return DEFAULT_RECOVERY_USERNAME;
        }

        return username.trim();
    }

    private void assertValidRecoveryToken(String providedRecoveryToken) {
        if (adminRecoveryToken.isBlank()) {
            throw new AdminRecoveryUnavailableException("Admin recovery is unavailable");
        }

        if (providedRecoveryToken == null || providedRecoveryToken.isBlank() ||
                !MessageDigest.isEqual(
                        adminRecoveryToken.getBytes(StandardCharsets.UTF_8),
                        providedRecoveryToken.getBytes(StandardCharsets.UTF_8))) {
            throw new InvalidAdminRecoveryTokenException("Invalid recovery token");
        }
    }
}
