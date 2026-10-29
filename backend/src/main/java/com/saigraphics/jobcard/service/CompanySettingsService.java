package com.saigraphics.jobcard.service;

import com.saigraphics.jobcard.model.CompanySettings;
import com.saigraphics.jobcard.repository.CompanySettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanySettingsService {

    private final CompanySettingsRepository settingsRepository;
    private final ActivityLogService activityLogService;

    public CompanySettings getSettings() {
        return settingsRepository.findById(1L).orElseGet(() -> {
            CompanySettings defaults = CompanySettings.builder()
                    .id(1L)
                    .companyName("Sai Graphics")
                    .ownerName("G. Chandru")
                    .logoUrl("")
                    .phone("+91 98765 43210")
                    .email("saigraphicsch5@gmail.com")
                    .gstNumber("33AAAAA0000A1Z5")
                    .address("No. 142, Industrial Print Zone, Main Press Road, Chennai - 600032")
                    .currency("₹")
                    .jobPrefix("JC-2026-")
                    .terms("1. Please check color proof before final approval.\n2. 50% advance required for processing.\n3. Goods once printed will not be taken back.")
                    .build();
            return settingsRepository.save(defaults);
        });
    }

    @Transactional
    public CompanySettings updateSettings(CompanySettings settings) {
        settings.setId(1L);
        CompanySettings saved = settingsRepository.save(settings);
        activityLogService.addLog("Settings Updated", "Company branding and owner details updated.", "1", "Settings");
        return saved;
    }
}
