package com.prakash.gateaway_service.Controller;

import com.prakash.gateaway_service.DTO.RouteGroupRequestDto;
import com.prakash.gateaway_service.DTO.RouteGroupResponseDto;
import com.prakash.gateaway_service.Service.RouteGroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/route-groups")
public class RouteGroupController {

    private final RouteGroupService routeGroupService;

    public RouteGroupController(RouteGroupService routeGroupService) {
        this.routeGroupService = routeGroupService;
    }

    @GetMapping
    public List<RouteGroupResponseDto> findAllRouteGroups() {
        return routeGroupService.findAllRouteGroups();
    }

    @PostMapping
    public ResponseEntity<RouteGroupResponseDto> createRouteGroup(@RequestBody RouteGroupRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routeGroupService.createRouteGroup(request));
    }

    @PatchMapping("/{id}")
    public RouteGroupResponseDto updateRouteGroup(
            @PathVariable Long id,
            @RequestBody RouteGroupRequestDto request
    ) {
        return routeGroupService.updateRouteGroup(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRouteGroup(@PathVariable Long id) {
        routeGroupService.deleteRouteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
