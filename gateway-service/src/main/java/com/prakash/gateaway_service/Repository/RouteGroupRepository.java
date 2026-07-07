package com.prakash.gateaway_service.Repository;

import com.prakash.gateaway_service.Entity.RouteGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteGroupRepository extends JpaRepository<RouteGroup, Long> {
    boolean existsByNameIgnoreCase(String name);

    Optional<RouteGroup> findByNameIgnoreCase(String name);

    @EntityGraph(attributePaths = "rules")
    List<RouteGroup> findAllByOrderByPriorityDescNameAsc();

    @EntityGraph(attributePaths = "rules")
    List<RouteGroup> findByActiveTrueOrderByPriorityDescNameAsc();
}
