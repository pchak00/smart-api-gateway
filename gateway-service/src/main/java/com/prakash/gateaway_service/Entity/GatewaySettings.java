package com.prakash.gateaway_service.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "gateway_settings")
public class GatewaySettings {

    @Id
    private Long id;

    @Column(nullable = false)
    private String upstreamBaseUrl;

    @Column(nullable = false)
    private String healthCheckPath;

    @Column(nullable = false)
    private Integer timeoutMs;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private String updatedBy;

    public GatewaySettings() {
    }

    @PrePersist
    @PreUpdate
    void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUpstreamBaseUrl() {
        return upstreamBaseUrl;
    }

    public void setUpstreamBaseUrl(String upstreamBaseUrl) {
        this.upstreamBaseUrl = upstreamBaseUrl;
    }

    public String getHealthCheckPath() {
        return healthCheckPath;
    }

    public void setHealthCheckPath(String healthCheckPath) {
        this.healthCheckPath = healthCheckPath;
    }

    public Integer getTimeoutMs() {
        return timeoutMs;
    }

    public void setTimeoutMs(Integer timeoutMs) {
        this.timeoutMs = timeoutMs;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
}
