package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.GatewaySettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GatewaySettingsRepository extends JpaRepository<GatewaySettings, Long> {
}
