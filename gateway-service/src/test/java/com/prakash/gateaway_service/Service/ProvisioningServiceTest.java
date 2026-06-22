package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.ProvisionClientRequestDto;
import com.prakash.gateaway_service.DTO.ProvisionClientResponseDto;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.ProvisioningToken;
import com.prakash.gateaway_service.Exception.DisallowedProvisioningPlanException;
import com.prakash.gateaway_service.Exception.InactiveProvisioningTokenException;
import com.prakash.gateaway_service.Exception.InvalidProvisioningTokenException;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.ProvisioningTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ProvisioningServiceTest {

    private static final String RAW_TOKEN = "demo-provisioning-token";
    private static final String SEEDED_TOKEN_HASH = "$2a$10$0moifO.zZhsGrz/gspi4EeKQjeZkEBbp2Ea7qnFhFfvadWNfPHd1C";

    private ProvisioningTokenRepository provisioningTokenRepository;
    private PlanRepository planRepository;
    private ClientService clientService;
    private PasswordEncoder passwordEncoder;
    private ProvisioningService provisioningService;

    @BeforeEach
    void setUp() {
        provisioningTokenRepository = mock(ProvisioningTokenRepository.class);
        planRepository = mock(PlanRepository.class);
        clientService = mock(ClientService.class);
        passwordEncoder = new BCryptPasswordEncoder();
        provisioningService = new ProvisioningService(
                provisioningTokenRepository,
                planRepository,
                clientService,
                passwordEncoder
        );
    }

    @Test
    void seededHashMatchesDemoToken() {
        assertTrue(passwordEncoder.matches(RAW_TOKEN, SEEDED_TOKEN_HASH));
    }

    @Test
    void rejectsMissingToken() {
        ProvisionClientRequestDto request = new ProvisionClientRequestDto("client", null, null);

        assertThrows(
                InvalidProvisioningTokenException.class,
                () -> provisioningService.provisionClient(null, request)
        );
        verify(provisioningTokenRepository, never()).findAll();
    }

    @Test
    void rejectsInvalidToken() {
        when(provisioningTokenRepository.findAll()).thenReturn(List.of());
        ProvisionClientRequestDto request = new ProvisionClientRequestDto("client", null, null);

        assertThrows(
                InvalidProvisioningTokenException.class,
                () -> provisioningService.provisionClient("invalid", request)
        );
    }

    @Test
    void rejectsInactiveToken() {
        ProvisioningToken token = token(false);
        when(provisioningTokenRepository.findAll()).thenReturn(List.of(token));
        ProvisionClientRequestDto request = new ProvisionClientRequestDto("client", null, null);

        assertThrows(
                InactiveProvisioningTokenException.class,
                () -> provisioningService.provisionClient(RAW_TOKEN, request)
        );
        verifyNoInteractions(clientService);
    }

    @Test
    void provisionsWithDefaultPlanAndUpdatesLastUsedAt() {
        ProvisioningToken token = token(true);
        Plan plan = plan("FREE");
        Client client = client(plan);
        when(provisioningTokenRepository.findAll()).thenReturn(List.of(token));
        when(planRepository.findPlanByName("FREE")).thenReturn(Optional.of(plan));
        when(clientService.createClient("signup-user-123", plan, true, "user_123")).thenReturn(client);

        ProvisionClientResponseDto response = provisioningService.provisionClient(
                RAW_TOKEN,
                new ProvisionClientRequestDto("signup-user-123", null, "user_123")
        );

        assertEquals(42L, response.id());
        assertEquals("signup-user-123", response.clientName());
        assertEquals("generated-api-key", response.apiKey());
        assertEquals("FREE", response.planName());
        assertEquals("user_123", response.externalReference());
        assertNotNull(token.getLastUsedAt());
        verify(provisioningTokenRepository).save(token);
    }

    @Test
    void rejectsPlanOverride() {
        ProvisioningToken token = token(true);
        when(provisioningTokenRepository.findAll()).thenReturn(List.of(token));
        ProvisionClientRequestDto request = new ProvisionClientRequestDto("client", "PRO", null);

        assertThrows(
                DisallowedProvisioningPlanException.class,
                () -> provisioningService.provisionClient(RAW_TOKEN, request)
        );
        verify(planRepository, never()).findPlanByName("PRO");
    }

    private ProvisioningToken token(boolean active) {
        ProvisioningToken token = new ProvisioningToken();
        token.setTokenHash(SEEDED_TOKEN_HASH);
        token.setDefaultPlanName("FREE");
        token.setActive(active);
        return token;
    }

    private Plan plan(String name) {
        Plan plan = new Plan();
        plan.setName(name);
        return plan;
    }

    private Client client(Plan plan) {
        Client client = new Client();
        client.setId(42L);
        client.setName("signup-user-123");
        client.setApiKey("generated-api-key");
        client.setPlan(plan);
        client.setActive(true);
        client.setExternalReference("user_123");
        return client;
    }
}
