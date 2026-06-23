package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.AdminRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRefreshTokenRepository extends JpaRepository<AdminRefreshToken, Long> {
    Optional<AdminRefreshToken> findByTokenHash(String tokenHash);
}
