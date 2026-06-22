package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
public interface ClientRepository extends JpaRepository<Client, Long> {
    Optional<Client> findByApiKey(String apiKey);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByPlanId(Long planId);
}
