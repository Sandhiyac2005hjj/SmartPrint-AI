package com.saigraphics.jobcard.controller;

import com.saigraphics.jobcard.model.ActivityLog;
import com.saigraphics.jobcard.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<ActivityLog>> getRecentLogs() {
        return ResponseEntity.ok(activityLogService.getRecentLogs());
    }

    @PostMapping
    public ResponseEntity<ActivityLog> addLog(@RequestBody Map<String, String> payload) {
        String action = payload.get("action");
        String details = payload.get("details");
        String entityId = payload.get("entityId");
        String entityType = payload.get("entityType");

        ActivityLog log = activityLogService.addLog(action, details, entityId, entityType);
        return new ResponseEntity<>(log, HttpStatus.CREATED);
    }
}
