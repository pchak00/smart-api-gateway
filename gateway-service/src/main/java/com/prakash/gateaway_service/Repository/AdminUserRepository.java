package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.AdminRole;
import com.prakash.gateaway_service.Entity.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByUsername(String username);
    boolean existsByUsername(String username);
    long countByRole(AdminRole role);
}
