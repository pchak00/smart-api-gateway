package com.prakash.gateaway_service.Entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
public class AbuseAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    private String message;

    private String severity; // LOW, MEDIUM, HIGH

    private Integer blockedRequestCount;

    private LocalDateTime windowStart;

    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private AbuseAlertStatus status;

    private LocalDateTime acknowledgedAt;

    private String acknowledgedBy;

    private LocalDateTime resolvedAt;

    private String resolvedBy;

    private LocalDateTime lastStatusChangedAt;

    @PrePersist
    void initializeLifecycle() {
        if (status == null) {
            status = AbuseAlertStatus.OPEN;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (lastStatusChangedAt == null) {
            lastStatusChangedAt = createdAt;
        }
    }


    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Integer getBlockedRequestCount() {
        return blockedRequestCount;
    }

    public void setBlockedRequestCount(Integer blockedRequestCount) {
        this.blockedRequestCount = blockedRequestCount;
    }

    public LocalDateTime getWindowStart() {
        return windowStart;
    }

    public void setWindowStart(LocalDateTime windowStart) {
        this.windowStart = windowStart;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public AbuseAlertStatus getStatus() {
        return status;
    }

    public void setStatus(AbuseAlertStatus status) {
        this.status = status;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public String getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(String acknowledgedBy) {
        this.acknowledgedBy = acknowledgedBy;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(String resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public LocalDateTime getLastStatusChangedAt() {
        return lastStatusChangedAt;
    }

    public void setLastStatusChangedAt(LocalDateTime lastStatusChangedAt) {
        this.lastStatusChangedAt = lastStatusChangedAt;
    }

}
