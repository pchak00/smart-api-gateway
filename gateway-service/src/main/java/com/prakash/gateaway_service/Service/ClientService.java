package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.ClientRequestDto;
import com.prakash.gateaway_service.DTO.ClientResponseDto;
import com.prakash.gateaway_service.DTO.ClientStatsResponseDto;
import com.prakash.gateaway_service.DTO.UpdateClientPlanRequest;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Exception.ClientNotFoundException;
import com.prakash.gateaway_service.Exception.DuplicateClientException;
import com.prakash.gateaway_service.Exception.InvalidClientException;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ClientService {
    private static final int MAX_CLIENT_NAME_LENGTH = 255;
    private static final int MAX_EXTERNAL_REFERENCE_LENGTH = 255;

    private final UsageLogRepository usageLogRepository;
    private final ClientRepository clientRepository;
    private final PlanRepository planRepository;

    ClientService(UsageLogRepository usageLogRepository,  ClientRepository clientRepository,  PlanRepository planRepository) {
        this.usageLogRepository = usageLogRepository;
        this.clientRepository = clientRepository;
        this.planRepository = planRepository;
    }

    public ClientStatsResponseDto getStats(Long clientId) {

        long total = usageLogRepository.countByClientId(clientId);
        long allowed = usageLogRepository.countByClientIdAndAllowed(clientId, true);
        long blocked = usageLogRepository.countByClientIdAndAllowed(clientId, false);

        double blockRate = total == 0 ? 0 : ((double) blocked / total) * 100;

        return new ClientStatsResponseDto(clientId, total, allowed, blocked, blockRate);
    }

    @Transactional
    public List<ClientResponseDto> showAllClients() {
        List<ClientResponseDto> clientResponseDtoList = new ArrayList<>();
        List<Client>  clients = clientRepository.findAll();
        for( Client client : clients ) {
            clientResponseDtoList.add(ClientResponseDto.from(client));
        }
        return clientResponseDtoList;
    }

    @Transactional
    public ClientResponseDto addClient(ClientRequestDto clientRequestDto) {
        Plan plan = planRepository.findById(clientRequestDto.planId()).orElseThrow(() -> new PlanNotFoundException("Plan not found with id: "+ clientRequestDto.planId()));
        Client client = createClient(clientRequestDto.name(), plan, clientRequestDto.active(), null);
        return ClientResponseDto.from(client);
    }

    @Transactional
    public Client createClient(String clientName, Plan plan, Boolean active, String externalReference) {
        String normalizedName = validateClientName(clientName);
        if (clientRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new DuplicateClientException("Client already exists: " + normalizedName);
        }

        Client client = new Client();
        client.setName(normalizedName);
        client.setPlan(plan);
        plan.addClient(client);
        client.setActive(active);
        client.setExternalReference(normalizeExternalReference(externalReference));
        client.setApiKey(UUID.randomUUID().toString());

        try {
            return clientRepository.saveAndFlush(client);
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateClientException("Client already exists: " + normalizedName);
        }
    }

    @Transactional
    public void deleteClient(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ClientNotFoundException("Client not found with id: " + clientId));

        clientRepository.delete(client);
    }

    @Transactional
    public ClientResponseDto updateClientPlan(
            Long clientId,
            UpdateClientPlanRequest request
    ) {

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() ->
                        new ClientNotFoundException(
                                "Client not found with id: " + clientId));

        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() ->
                        new PlanNotFoundException(
                                "Plan not found with id: " + request.planId()));

        client.setPlan(plan);

        Client savedClient = clientRepository.save(client);

        return ClientResponseDto.from(savedClient);
    }

    private String validateClientName(String clientName) {
        if (clientName == null || clientName.isBlank()) {
            throw new InvalidClientException("Client name is required");
        }

        String normalized = clientName.trim();
        if (normalized.length() > MAX_CLIENT_NAME_LENGTH) {
            throw new InvalidClientException("Client name must be " + MAX_CLIENT_NAME_LENGTH + " characters or fewer");
        }
        return normalized;
    }

    private String normalizeExternalReference(String externalReference) {
        if (externalReference == null || externalReference.isBlank()) {
            return null;
        }

        String normalized = externalReference.trim();
        if (normalized.length() > MAX_EXTERNAL_REFERENCE_LENGTH) {
            throw new InvalidClientException("External reference must be " + MAX_EXTERNAL_REFERENCE_LENGTH + " characters or fewer");
        }
        return normalized;
    }
}
