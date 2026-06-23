package com.prakash.gateaway_service.Service;

import com.prakash.gateaway_service.Entity.AbuseAlert;
import com.prakash.gateaway_service.Entity.AbuseAlertStatus;
import com.prakash.gateaway_service.Entity.Client;
import com.prakash.gateaway_service.Entity.Plan;
import com.prakash.gateaway_service.Exception.InvalidAbuseAlertTransitionException;
import com.prakash.gateaway_service.Repository.AbuseAlertRepository;
import com.prakash.gateaway_service.Repository.UsageLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AbuseDetectionServiceTest {

    private UsageLogRepository usageLogRepository;
    private AbuseAlertRepository abuseAlertRepository;
    private AbuseDetectionService abuseDetectionService;
    private Client client;

    @BeforeEach
    void setUp() {
        usageLogRepository = mock(UsageLogRepository.class);
        abuseAlertRepository = mock(AbuseAlertRepository.class);
        abuseDetectionService = new AbuseDetectionService(usageLogRepository, abuseAlertRepository);
        client = client();
    }

    @Test
    void newAlertDefaultsToOpenWhenThresholdIsCrossed() {
        when(usageLogRepository.countByClientIdAndAllowedFalseAndTimestampAfter(eq(1L), any()))
                .thenReturn(10L);
        when(abuseAlertRepository.findLatestActiveAlert(1L)).thenReturn(Optional.empty());
        ArgumentCaptor<AbuseAlert> alertCaptor = ArgumentCaptor.forClass(AbuseAlert.class);

        abuseDetectionService.checkAndCreateAlert(client);

        verify(abuseAlertRepository).save(alertCaptor.capture());
        AbuseAlert alert = alertCaptor.getValue();
        assertEquals(AbuseAlertStatus.OPEN, alert.getStatus());
        assertEquals(10, alert.getBlockedRequestCount());
        assertEquals("HIGH", alert.getSeverity());
        assertNotNull(alert.getLastStatusChangedAt());
    }

    @Test
    void belowThresholdDoesNotCreateAlert() {
        when(usageLogRepository.countByClientIdAndAllowedFalseAndTimestampAfter(eq(1L), any()))
                .thenReturn(9L);

        abuseDetectionService.checkAndCreateAlert(client);

        verify(abuseAlertRepository, never()).save(any());
    }

    @Test
    void openAlertInCooldownIsUpdated() {
        AbuseAlert alert = alert(AbuseAlertStatus.OPEN);
        when(usageLogRepository.countByClientIdAndAllowedFalseAndTimestampAfter(eq(1L), any()))
                .thenReturn(10L)
                .thenReturn(12L);
        when(abuseAlertRepository.findLatestActiveAlert(1L)).thenReturn(Optional.of(alert));

        abuseDetectionService.checkAndCreateAlert(client);

        assertEquals(12, alert.getBlockedRequestCount());
        assertEquals(AbuseAlertStatus.OPEN, alert.getStatus());
        verify(abuseAlertRepository).save(alert);
    }

    @Test
    void acknowledgedAlertInCooldownIsUpdatedAndStaysAcknowledged() {
        AbuseAlert alert = alert(AbuseAlertStatus.ACKNOWLEDGED);
        when(usageLogRepository.countByClientIdAndAllowedFalseAndTimestampAfter(eq(1L), any()))
                .thenReturn(10L)
                .thenReturn(15L);
        when(abuseAlertRepository.findLatestActiveAlert(1L)).thenReturn(Optional.of(alert));

        abuseDetectionService.checkAndCreateAlert(client);

        assertEquals(15, alert.getBlockedRequestCount());
        assertEquals(AbuseAlertStatus.ACKNOWLEDGED, alert.getStatus());
        verify(abuseAlertRepository).save(alert);
    }

    @Test
    void resolvedAlertIsNotReopenedWhenAbuseContinues() {
        when(usageLogRepository.countByClientIdAndAllowedFalseAndTimestampAfter(eq(1L), any()))
                .thenReturn(10L);
        when(abuseAlertRepository.findLatestActiveAlert(1L)).thenReturn(Optional.empty());
        ArgumentCaptor<AbuseAlert> alertCaptor = ArgumentCaptor.forClass(AbuseAlert.class);

        abuseDetectionService.checkAndCreateAlert(client);

        verify(abuseAlertRepository).save(alertCaptor.capture());
        assertEquals(AbuseAlertStatus.OPEN, alertCaptor.getValue().getStatus());
    }

    @Test
    void acknowledgeOpenAlertSetsLifecycleMetadata() {
        AbuseAlert alert = alert(AbuseAlertStatus.OPEN);
        when(abuseAlertRepository.findById(7L)).thenReturn(Optional.of(alert));
        when(abuseAlertRepository.save(alert)).thenReturn(alert);

        abuseDetectionService.acknowledgeAlert(7L, "super admin");

        assertEquals(AbuseAlertStatus.ACKNOWLEDGED, alert.getStatus());
        assertEquals("super admin", alert.getAcknowledgedBy());
        assertNotNull(alert.getAcknowledgedAt());
        assertNotNull(alert.getLastStatusChangedAt());
    }

    @Test
    void resolveAcknowledgedAlertSetsLifecycleMetadata() {
        AbuseAlert alert = alert(AbuseAlertStatus.ACKNOWLEDGED);
        when(abuseAlertRepository.findById(7L)).thenReturn(Optional.of(alert));
        when(abuseAlertRepository.save(alert)).thenReturn(alert);

        abuseDetectionService.resolveAlert(7L, "super admin");

        assertEquals(AbuseAlertStatus.RESOLVED, alert.getStatus());
        assertEquals("super admin", alert.getResolvedBy());
        assertNotNull(alert.getResolvedAt());
    }

    @Test
    void resolvedAlertCannotBeAcknowledged() {
        AbuseAlert alert = alert(AbuseAlertStatus.RESOLVED);
        when(abuseAlertRepository.findById(7L)).thenReturn(Optional.of(alert));

        assertThrows(InvalidAbuseAlertTransitionException.class,
                () -> abuseDetectionService.acknowledgeAlert(7L, "super admin"));
    }

    private AbuseAlert alert(AbuseAlertStatus status) {
        AbuseAlert alert = new AbuseAlert();
        alert.setId(7L);
        alert.setClient(client);
        alert.setStatus(status);
        alert.setSeverity("HIGH");
        alert.setMessage("Client exceeded blocked request threshold");
        alert.setWindowStart(LocalDateTime.now().minusMinutes(5));
        alert.setCreatedAt(LocalDateTime.now().minusMinutes(1));
        alert.setBlockedRequestCount(10);
        return alert;
    }

    private Client client() {
        Plan plan = new Plan();
        plan.setId(1L);
        plan.setName("FREE");
        plan.setRequestsPerMinute(10);

        Client client = new Client();
        client.setId(1L);
        client.setName("Demo Free Client");
        client.setApiKey("free-demo-api-key");
        client.setPlan(plan);
        client.setActive(true);
        return client;
    }
}
