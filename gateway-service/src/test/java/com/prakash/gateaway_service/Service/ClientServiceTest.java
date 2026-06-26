package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.ClientApiKeyRotationResponseDto;
import com.prakash.gateaway_service.DTO.ClientMetadataResponseDto;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Entity.UsageLog;
import com.prakash.gateaway_service.Exception.ClientNotFoundException;
import com.prakash.gateaway_service.Exception.DuplicateClientException;
import com.prakash.gateaway_service.Exception.InvalidClientException;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ClientServiceTest {

    private ClientRepository clientRepository;
    private ClientService clientService;

    @BeforeEach
    void setUp() {
        UsageLogRepository usageLogRepository = mock(UsageLogRepository.class);
        clientRepository = mock(ClientRepository.class);
        PlanRepository planRepository = mock(PlanRepository.class);
        clientService = new ClientService(usageLogRepository, clientRepository, planRepository);
    }

    @Test
    void rejectsBlankClientName() {
        assertThrows(
                InvalidClientException.class,
                () -> clientService.createClient("  ", new Plan(), true, null)
        );
    }

    @Test
    void rejectsDuplicateClientNameIgnoringCase() {
        when(clientRepository.existsByNameIgnoreCase("Acme")).thenReturn(true);

        assertThrows(
                DuplicateClientException.class,
                () -> clientService.createClient(" Acme ", new Plan(), true, null)
        );
    }

    @Test
    void createsActiveClientWithGeneratedApiKeyAndExternalReference() {
        Plan plan = new Plan();
        plan.setName("FREE");
        when(clientRepository.existsByNameIgnoreCase("Acme")).thenReturn(false);
        when(clientRepository.saveAndFlush(any(Client.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Client client = clientService.createClient(" Acme ", plan, true, " user_123 ");

        assertEquals("Acme", client.getName());
        assertEquals("FREE", client.getPlan().getName());
        assertEquals("user_123", client.getExternalReference());
        assertEquals(true, client.getActive());
        assertNotNull(client.getApiKey());
    }

    @Test
    void rotatesApiKeyWithoutChangingClientIdentityPlanStatusOrUsageAssociation() {
        Plan plan = plan(2L, "PRO");
        Client client = client(42L, "Acme", "old-api-key", plan, true);
        List<UsageLog> usageLogs = new ArrayList<>();
        client.setUsageLogs(usageLogs);
        when(clientRepository.findById(42L)).thenReturn(Optional.of(client));
        when(clientRepository.saveAndFlush(any(Client.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ClientApiKeyRotationResponseDto response = clientService.rotateApiKey(42L);

        assertEquals(42L, response.id());
        assertEquals("Acme", response.clientName());
        assertEquals("PRO", response.planName());
        assertEquals(true, response.active());
        assertNotNull(response.apiKey());
        assertNotEquals("old-api-key", response.apiKey());
        assertNotNull(response.rotatedAt());
        assertEquals(42L, client.getId());
        assertEquals("Acme", client.getName());
        assertSame(plan, client.getPlan());
        assertSame(usageLogs, client.getUsageLogs());
        verify(clientRepository).saveAndFlush(argThat(savedClient ->
                savedClient.getId().equals(42L)
                        && savedClient.getName().equals("Acme")
                        && savedClient.getPlan() == plan
                        && savedClient.getActive()
                        && !savedClient.getApiKey().equals("old-api-key")
        ));
    }

    @Test
    void rejectsApiKeyRotationForMissingClient() {
        when(clientRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(
                ClientNotFoundException.class,
                () -> clientService.rotateApiKey(404L)
        );
    }

    @Test
    void disablesClientWithoutReturningApiKey() {
        Plan plan = plan(1L, "FREE");
        Client client = client(7L, "Acme", "current-api-key", plan, true);
        when(clientRepository.findById(7L)).thenReturn(Optional.of(client));
        when(clientRepository.save(client)).thenReturn(client);

        ClientMetadataResponseDto response = clientService.disableClient(7L);

        assertEquals(7L, response.id());
        assertEquals("Acme", response.clientName());
        assertEquals("FREE", response.planName());
        assertEquals(false, response.active());
        assertEquals(false, client.getActive());
    }

    @Test
    void enablesClientWithoutReturningApiKey() {
        Plan plan = plan(1L, "FREE");
        Client client = client(7L, "Acme", "current-api-key", plan, false);
        when(clientRepository.findById(7L)).thenReturn(Optional.of(client));
        when(clientRepository.save(client)).thenReturn(client);

        ClientMetadataResponseDto response = clientService.enableClient(7L);

        assertEquals(7L, response.id());
        assertEquals("Acme", response.clientName());
        assertEquals("FREE", response.planName());
        assertEquals(true, response.active());
        assertEquals(true, client.getActive());
    }

    private Plan plan(Long id, String name) {
        Plan plan = new Plan();
        plan.setId(id);
        plan.setName(name);
        return plan;
    }

    private Client client(Long id, String name, String apiKey, Plan plan, boolean active) {
        Client client = new Client();
        client.setId(id);
        client.setName(name);
        client.setApiKey(apiKey);
        client.setPlan(plan);
        client.setActive(active);
        return client;
    }
}
