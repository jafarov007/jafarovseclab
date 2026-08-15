// Scenario 6: Admin Privilege Escalation Controller
// Language: Java 17 / Spring Boot 3.x Framework

package com.jafarovseclab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.jafarovseclab.service.UserService;
import com.jafarovseclab.dto.PromoteRequestDTO;

@RestController
@RequestMapping("/api/v6/admin")
public class AdminController {

    @Autowired
    private UserService userService;

    /**
     * VULNERABLE ENDPOINT: Promotes user role to admin.
     * Flaw: Missing @PreAuthorize("hasRole('ADMIN')") annotation.
     * Endpoint is publicly reachable without authentication or privilege checks (BFLA).
     */
    @PostMapping("/promote")
    public ResponseEntity<?> promoteUserRole(@RequestBody PromoteRequestDTO request) {
        if (request.getUserId() == null || request.getRole() == null) {
            return ResponseEntity.badRequest().body("userId and role parameters are required");
        }

        boolean updated = userService.updateUserRole(request.getUserId(), request.getRole());

        if (!updated) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(new PromoteResponse(
            "success",
            "User role updated successfully (BFLA Exploit)",
            request.getUserId(),
            request.getRole()
        ));
    }
}
