package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.AbuseAlertResponseDto;
import com.prakash.gateaway_service.Entity.AbuseAlert;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Repository.AbuseAlertRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AbuseDetectionService {

    private final UsageLogRepository usageLogRepository;
    private final AbuseAlertRepository abuseAlertRepository;

    public AbuseDetectionService(UsageLogRepository usageLogRepository, AbuseAlertRepository abuseAlertRepository) {
        this.usageLogRepository = usageLogRepository;
        this.abuseAlertRepository = abuseAlertRepository;
    }
@Transactional
    public void checkAndCreateAlert(Client client) {

        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(5);
        LocalDateTime now = LocalDateTime.now();

        long blockedCount = usageLogRepository
                .countByClientIdAndAllowedFalseAndTimestampAfter(
                        client.getId(),
                        windowStart
                );

        if(blockedCount >= 10) {
            Optional<AbuseAlert> lastAlertOpt =
                    abuseAlertRepository.findTopByClientIdOrderByCreatedAtDesc(client.getId());

            // cooldown: 5 minutes
            if (lastAlertOpt.isPresent()) {
                LocalDateTime lastCreated = lastAlertOpt.get().getCreatedAt();

                if (lastCreated.isAfter(now.minusMinutes(5))) {
                    long newBlockCont =
                            usageLogRepository.countByClientIdAndAllowedFalseAndTimestampAfter(client.getId(), lastAlertOpt.get().getWindowStart());
                    lastAlertOpt.get().setBlockedRequestCount((int)newBlockCont); //update block count of existing alert
                    abuseAlertRepository.save(lastAlertOpt.get());
                    return; // skip duplicate alert
                }
            }
            AbuseAlert abuseAlert = new AbuseAlert();
            abuseAlert.setClient(client);
            abuseAlert.setMessage("Client exceeded blocked request threshold");
            abuseAlert.setSeverity("HIGH");
            abuseAlert.setBlockedRequestCount((int) blockedCount);
            abuseAlert.setWindowStart(windowStart);
            abuseAlert.setCreatedAt(LocalDateTime.now());


            abuseAlertRepository.save(abuseAlert);

        }
    }
    @Transactional
    public List<AbuseAlertResponseDto> findClientAbuse(Long clientId) {
        List<AbuseAlert> alerts = abuseAlertRepository.findByClientIdOrderByCreatedAtDesc(clientId);
        List<AbuseAlertResponseDto> responseDtos = new ArrayList<>();
        for(AbuseAlert alert: alerts) {
            responseDtos.add(AbuseAlertResponseDto.from(alert));
        }
        return responseDtos;
    }

    @Transactional
    public List<AbuseAlertResponseDto> findAllAbuseAlerts() {
        return abuseAlertRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AbuseAlertResponseDto::from)
                .toList();
    }
}
