package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Exception.DuplicateClientException;
import com.prakash.gateaway_service.Exception.InvalidClientException;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
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
}
