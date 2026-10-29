package com.saigraphics.jobcard.service;

import com.saigraphics.jobcard.model.ActivityLog;
import com.saigraphics.jobcard.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public List<ActivityLog> getRecentLogs() {
        return activityLogRepository.findTop100ByOrderByTimestampDesc();
    }

    @Transactional
    public ActivityLog addLog(String action, String details, String entityId, String entityType) {
        ActivityLog log = ActivityLog.builder()
                .id("log-" + System.currentTimeMillis())
                .action(action)
                .details(details)
                .timestamp(LocalDateTime.now())
                .entityId(entityId)
                .entityType(entityType)
                .build();
        return activityLogRepository.save(log);
    }
}
