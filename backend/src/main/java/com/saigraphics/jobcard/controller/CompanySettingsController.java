package com.saigraphics.jobcard.controller;

import com.saigraphics.jobcard.model.CompanySettings;
import com.saigraphics.jobcard.service.CompanySettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompanySettingsController {

    private final CompanySettingsService settingsService;

    @GetMapping
    public ResponseEntity<CompanySettings> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<CompanySettings> updateSettings(@RequestBody CompanySettings settings) {
        return ResponseEntity.ok(settingsService.updateSettings(settings));
    }
}
