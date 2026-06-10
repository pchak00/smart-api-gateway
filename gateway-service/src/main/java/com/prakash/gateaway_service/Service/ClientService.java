package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.ClientRequestDto;
import com.prakash.gateaway_service.DTO.ClientResponseDto;
import com.prakash.gateaway_service.DTO.ClientStatsResponseDto;
import com.prakash.gateaway_service.DTO.UpdateClientPlanRequest;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Exception.ClientNotFoundException;
import com.prakash.gateaway_service.Exception.PlanNotFoundException;
import com.prakash.gateaway_service.Repository.ClientRepository;
import com.prakash.gateaway_service.Repository.PlanRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ClientService {

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

    public List<ClientResponseDto> showAllClients() {
        List<ClientResponseDto> clientResponseDtoList = new ArrayList<>();
        List<Client>  clients = clientRepository.findAll();
        for( Client client : clients ) {
            clientResponseDtoList.add(new ClientResponseDto(client.getName(), client.getApiKey(), client.getActive(),client.getPlan().getName()));
        }
        return clientResponseDtoList;
    }

    public ClientResponseDto addClient(ClientRequestDto clientRequestDto) {
        Client client = new Client();

        client.setName(clientRequestDto.name());
        Plan plan = planRepository.findById(clientRequestDto.planId()).orElseThrow(() -> new PlanNotFoundException("Plan not found with id: "+ clientRequestDto.planId()));
        client.setPlan(plan);
        plan.addClient(client);
        client.setActive(clientRequestDto.active());
        client.setApiKey(UUID.randomUUID().toString()); // api key generator

        clientRepository.save(client);

        return new ClientResponseDto(client.getName(), client.getApiKey(), client.getActive() ,client.getPlan().getName());
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
}
