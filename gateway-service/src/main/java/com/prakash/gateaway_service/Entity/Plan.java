package com.prakash.gateaway_service.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String name;
    private Integer requestsPerMinute;
    private Double price;

    @OneToMany(mappedBy = "plan")
    @JsonIgnore
    private List<Client> clients = new ArrayList<>();

    @OneToMany(mappedBy = "plan")
    @JsonIgnore
    private List<RouteLimit> routeLimits = new ArrayList<>();

    public List<Client> getClients() {
        return clients;
    }

    public void setClients(List<Client> clients) {
        this.clients = clients;
    }

    public Plan() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getRequestsPerMinute() {
        return requestsPerMinute;
    }

    public void setRequestsPerMinute(Integer requestsPerMinute) {
        this.requestsPerMinute = requestsPerMinute;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public void addClient(Client client) {
        clients.add(client);
    }
    public void addRouteLimit(RouteLimit routeLimit) {
        routeLimits.add(routeLimit);
    }


}