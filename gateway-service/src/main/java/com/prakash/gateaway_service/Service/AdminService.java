package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.AdminDto;
import com.prakash.gateaway_service.DTO.AdminResponseDto;
import com.prakash.gateaway_service.Entity.AdminUser;
import com.prakash.gateaway_service.Exception.AdminNotFoundException;
import com.prakash.gateaway_service.Exception.DuplicateAdminException;
import com.prakash.gateaway_service.Exception.LastSuperAdminException;
import com.prakash.gateaway_service.Repository.AdminUserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

public class AdminService {
    private AdminUserRepository adminUserRepository;
    private PasswordEncoder passwordEncoder;
    public AdminService(AdminUserRepository adminUserRepository,  PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
    }
    @Transactional
    public AdminResponseDto createAdmin(AdminDto request) {
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

    @Transactional
    public void deleteAdmin(Long adminId) {
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() ->
                        new AdminNotFoundException("Admin not found with id: " + adminId));

        if (admin.getRole().equals("SUPER_ADMIN")) {
            long superAdminCount = adminUserRepository.countByRole("SUPER_ADMIN");

            if (superAdminCount <= 1) {
                throw new LastSuperAdminException("Cannot delete the last SUPER_ADMIN");
            }
        }

        adminUserRepository.delete(admin);
    }
}
