package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.CreateProvisioningTokenRequestDto;
import com.prakash.gateaway_service.DTO.CreateProvisioningTokenResponseDto;
import com.prakash.gateaway_service.DTO.ProvisionClientRequestDto;
import com.prakash.gateaway_service.DTO.ProvisionClientResponseDto;
import com.prakash.gateaway_service.DTO.ProvisioningTokenResponseDto;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.ProvisioningToken;
import com.prakash.gateaway_service.Exception.DisallowedProvisioningPlanException;
import com.prakash.gateaway_service.Exception.DuplicateProvisioningTokenException;
import com.prakash.gateaway_service.Exception.InactiveProvisioningTokenException;
import com.prakash.gateaway_service.Exception.InvalidProvisioningRequestException;
import com.prakash.gateaway_service.Exception.InvalidProvisioningTokenException;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Exception.ProvisioningTokenNotFoundException;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.ProvisioningTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
public class ProvisioningService {
    private static final int TOKEN_RANDOM_BYTE_COUNT = 32;
    private static final int MAX_TOKEN_NAME_LENGTH = 255;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

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

        ProvisioningToken token = findProvisioningToken(rawToken);

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

    public List<ProvisioningTokenResponseDto> findAllProvisioningTokens() {
        return provisioningTokenRepository.findAll()
                .stream()
                .map(ProvisioningTokenResponseDto::from)
                .toList();
    }

    @Transactional
    public CreateProvisioningTokenResponseDto createProvisioningToken(CreateProvisioningTokenRequestDto request) {
        if (request == null) {
            throw new InvalidProvisioningRequestException("Request body is required");
        }

        String name = validateProvisioningTokenName(request.name());
        String defaultPlanName = validateDefaultPlanName(request.defaultPlanName());

        if (provisioningTokenRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateProvisioningTokenException("Provisioning token already exists: " + name);
        }

        planRepository.findPlanByName(defaultPlanName)
                .orElseThrow(() -> new PlanNotFoundException("Plan not found with name: " + defaultPlanName));

        String rawToken = generateRawToken();
        ProvisioningToken provisioningToken = new ProvisioningToken();
        provisioningToken.setName(name);
        provisioningToken.setTokenHash(passwordEncoder.encode(rawToken));
        provisioningToken.setDefaultPlanName(defaultPlanName);
        provisioningToken.setActive(true);
        provisioningToken.setCreatedAt(LocalDateTime.now());

        ProvisioningToken savedToken = provisioningTokenRepository.save(provisioningToken);

        return CreateProvisioningTokenResponseDto.from(savedToken, rawToken);
    }

    @Transactional
    public ProvisioningTokenResponseDto disableProvisioningToken(Long provisioningTokenId) {
        ProvisioningToken provisioningToken = provisioningTokenRepository.findById(provisioningTokenId)
                .orElseThrow(() -> new ProvisioningTokenNotFoundException(
                        "Provisioning token not found with id: " + provisioningTokenId
                ));

        provisioningToken.setActive(false);
        ProvisioningToken savedToken = provisioningTokenRepository.save(provisioningToken);

        return ProvisioningTokenResponseDto.from(savedToken);
    }

    private ProvisioningToken findProvisioningToken(String rawToken) {
        return provisioningTokenRepository.findAll().stream()
                .filter(candidate -> passwordEncoder.matches(rawToken, candidate.getTokenHash()))
                .findFirst()
                .orElseThrow(() -> new InvalidProvisioningTokenException("Invalid provisioning token"));
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

    private String validateProvisioningTokenName(String name) {
        if (name == null || name.isBlank()) {
            throw new InvalidProvisioningRequestException("Provisioning token name is required");
        }

        String normalized = name.trim();
        if (normalized.length() > MAX_TOKEN_NAME_LENGTH) {
            throw new InvalidProvisioningRequestException(
                    "Provisioning token name must be " + MAX_TOKEN_NAME_LENGTH + " characters or fewer"
            );
        }
        return normalized;
    }

    private String validateDefaultPlanName(String defaultPlanName) {
        if (defaultPlanName == null || defaultPlanName.isBlank()) {
            throw new InvalidProvisioningRequestException("Default plan name is required");
        }
        return defaultPlanName.trim();
    }

    private String generateRawToken() {
        byte[] randomBytes = new byte[TOKEN_RANDOM_BYTE_COUNT];
        SECURE_RANDOM.nextBytes(randomBytes);
        return "prov_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}
