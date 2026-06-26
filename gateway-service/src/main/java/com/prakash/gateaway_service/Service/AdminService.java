package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.AdminDto;
import com.prakash.gateaway_service.DTO.AdminResponseDto;
import com.prakash.gateaway_service.DTO.UpdateAdminRoleDto;
import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.AdminNotFoundException;
import com.prakash.gateaway_service.Exception.AdminRoleHierarchyException;
import com.prakash.gateaway_service.Exception.DuplicateAdminException;
import com.prakash.gateaway_service.Exception.LastOwnerException;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {
    private AdminUserRepository adminUserRepository;
    private PasswordEncoder passwordEncoder;
    public AdminService(AdminUserRepository adminUserRepository,  PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
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
        assertNotRemovingLastOwner(admin.getRole(), null, "Cannot delete the last OWNER");

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
        assertNotRemovingLastOwner(admin.getRole(), request.role(), "Cannot demote the last OWNER");

        admin.setRole(request.role());

        AdminUser saved = adminUserRepository.save(admin);

        return AdminResponseDto.from(saved);
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
}
