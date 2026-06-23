package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.DTO.AbuseAlertResponseDto;
import com.prakash.gateaway_service.Entity.AbuseAlert;
import com.prakash.gateaway_service.Entity.AbuseAlertStatus;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Exception.AbuseAlertNotFoundException;
import com.prakash.gateaway_service.Exception.InvalidAbuseAlertStatusException;
import com.prakash.gateaway_service.Exception.InvalidAbuseAlertTransitionException;
import com.prakash.gateaway_service.Repository.AbuseAlertRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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
                    abuseAlertRepository.findLatestActiveAlert(client.getId());

            // cooldown: 5 minutes
            if (lastAlertOpt.isPresent()) {
                AbuseAlert activeAlert = lastAlertOpt.get();
                LocalDateTime lastCreated = activeAlert.getCreatedAt();

                if (lastCreated.isAfter(now.minusMinutes(5))) {
                    long newBlockCont =
                            usageLogRepository.countByClientIdAndAllowedFalseAndTimestampAfter(client.getId(), activeAlert.getWindowStart());
                    activeAlert.setBlockedRequestCount((int)newBlockCont); //update block count of existing alert
                    abuseAlertRepository.save(activeAlert);
                    return; // skip duplicate alert
                }
            }
            AbuseAlert abuseAlert = new AbuseAlert();
            abuseAlert.setClient(client);
            abuseAlert.setMessage("Client exceeded blocked request threshold");
            abuseAlert.setSeverity("HIGH");
            abuseAlert.setBlockedRequestCount((int) blockedCount);
            abuseAlert.setWindowStart(windowStart);
            abuseAlert.setCreatedAt(now);
            abuseAlert.setStatus(AbuseAlertStatus.OPEN);
            abuseAlert.setLastStatusChangedAt(now);


            abuseAlertRepository.save(abuseAlert);

        }
    }
    @Transactional
    public List<AbuseAlertResponseDto> findClientAbuse(Long clientId) {
        List<AbuseAlert> alerts = abuseAlertRepository.findByClientIdOrderByCreatedAtDesc(clientId);
        return alerts.stream()
                .map(AbuseAlertResponseDto::from)
                .toList();
    }

    @Transactional
    public List<AbuseAlertResponseDto> findAllAbuseAlerts(String status) {
        List<AbuseAlert> alerts = status == null || status.isBlank()
                ? abuseAlertRepository.findAllByOrderByCreatedAtDesc()
                : abuseAlertRepository.findByStatusIncludingLegacyOpen(parseStatus(status));

        return alerts
                .stream()
                .map(AbuseAlertResponseDto::from)
                .toList();
    }

    @Transactional
    public AbuseAlertResponseDto acknowledgeAlert(Long alertId, String username) {
        AbuseAlert alert = findAlert(alertId);
        AbuseAlertStatus status = normalizedStatus(alert);

        if (status == AbuseAlertStatus.RESOLVED) {
            throw new InvalidAbuseAlertTransitionException("Resolved alerts cannot be acknowledged");
        }
        if (status == AbuseAlertStatus.ACKNOWLEDGED) {
            return AbuseAlertResponseDto.from(alert);
        }

        LocalDateTime now = LocalDateTime.now();
        alert.setStatus(AbuseAlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(now);
        alert.setAcknowledgedBy(username);
        alert.setLastStatusChangedAt(now);

        return AbuseAlertResponseDto.from(abuseAlertRepository.save(alert));
    }

    @Transactional
    public AbuseAlertResponseDto resolveAlert(Long alertId, String username) {
        AbuseAlert alert = findAlert(alertId);
        AbuseAlertStatus status = normalizedStatus(alert);

        if (status == AbuseAlertStatus.RESOLVED) {
            return AbuseAlertResponseDto.from(alert);
        }

        LocalDateTime now = LocalDateTime.now();
        alert.setStatus(AbuseAlertStatus.RESOLVED);
        alert.setResolvedAt(now);
        alert.setResolvedBy(username);
        alert.setLastStatusChangedAt(now);

        return AbuseAlertResponseDto.from(abuseAlertRepository.save(alert));
    }

    private AbuseAlert findAlert(Long alertId) {
        return abuseAlertRepository.findById(alertId)
                .orElseThrow(() -> new AbuseAlertNotFoundException("Abuse alert not found with id: " + alertId));
    }

    private AbuseAlertStatus parseStatus(String status) {
        try {
            return AbuseAlertStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidAbuseAlertStatusException("Invalid abuse alert status: " + status);
        }
    }

    private AbuseAlertStatus normalizedStatus(AbuseAlert alert) {
        return alert.getStatus() == null ? AbuseAlertStatus.OPEN : alert.getStatus();
    }
}
