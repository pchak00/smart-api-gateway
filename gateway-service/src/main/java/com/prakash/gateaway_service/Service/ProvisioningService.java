package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.ProvisionClientRequestDto;
import com.prakash.gateaway_service.DTO.ProvisionClientResponseDto;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.ProvisioningToken;
import com.prakash.gateaway_service.Exception.DisallowedProvisioningPlanException;
import com.prakash.gateaway_service.Exception.InactiveProvisioningTokenException;
import com.prakash.gateaway_service.Exception.InvalidProvisioningRequestException;
import com.prakash.gateaway_service.Exception.InvalidProvisioningTokenException;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.ProvisioningTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ProvisioningService {

    private final ProvisioningTokenRepository provisioningTokenRepository;
    private final PlanRepository planRepository;
    private final ClientService clientService;
    private final PasswordEncoder passwordEncoder;

    public ProvisioningService(
            ProvisioningTokenRepository provisioningTokenRepository,
            PlanRepository planRepository,
            ClientService clientService,
            PasswordEncoder passwordEncoder
    ) {
        this.provisioningTokenRepository = provisioningTokenRepository;
        this.planRepository = planRepository;
        this.clientService = clientService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public ProvisionClientResponseDto provisionClient(String rawToken, ProvisionClientRequestDto request) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidProvisioningTokenException("Missing provisioning token");
        }
        if (request == null) {
            throw new InvalidProvisioningRequestException("Request body is required");
        }

        ProvisioningToken token = provisioningTokenRepository.findAll().stream()
                .filter(candidate -> passwordEncoder.matches(rawToken, candidate.getTokenHash()))
                .findFirst()
                .orElseThrow(() -> new InvalidProvisioningTokenException("Invalid provisioning token"));

        if (!Boolean.TRUE.equals(token.getActive())) {
            throw new InactiveProvisioningTokenException("Provisioning token is inactive");
        }

        String planName = resolvePlanName(token, request.planName());
        Plan plan = planRepository.findPlanByName(planName)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found with name: " + planName));

        Client client = clientService.createClient(
                request.clientName(),
                plan,
                true,
                request.externalReference()
        );

        token.setLastUsedAt(LocalDateTime.now());
        provisioningTokenRepository.save(token);

        return ProvisionClientResponseDto.from(client);
    }

    private String resolvePlanName(ProvisioningToken token, String requestedPlanName) {
        String defaultPlanName = token.getDefaultPlanName();
        if (defaultPlanName == null || defaultPlanName.isBlank()) {
            throw new InvalidProvisioningRequestException("Provisioning token has no default plan");
        }

        if (requestedPlanName == null || requestedPlanName.isBlank()) {
            return defaultPlanName;
        }

        String normalizedPlanName = requestedPlanName.trim();
        if (!defaultPlanName.equals(normalizedPlanName)) {
            throw new DisallowedProvisioningPlanException(
                    "Provisioning token may only assign plan: " + defaultPlanName
            );
        }
        return normalizedPlanName;
    }

}
