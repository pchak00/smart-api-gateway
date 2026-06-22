package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.ProvisioningToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProvisioningTokenRepository extends JpaRepository<ProvisioningToken, Long> {
}
