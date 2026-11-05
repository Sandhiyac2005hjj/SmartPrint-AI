package com.saigraphics.jobcard.controller;

import com.saigraphics.jobcard.model.JobCard;
import com.saigraphics.jobcard.service.JobCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobcards")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class JobCardController {

    private final JobCardService jobCardService;

    @GetMapping
    public ResponseEntity<List<JobCard>> getAllJobCards() {
        return ResponseEntity.ok(jobCardService.getAllJobCards());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobCard> getJobCardById(@PathVariable String id) {
        return ResponseEntity.ok(jobCardService.getJobCardById(id));
    }

    @PostMapping
    public ResponseEntity<JobCard> createJobCard(@RequestBody JobCard jobCard) {
        JobCard created = jobCardService.createOrUpdateJobCard(jobCard);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobCard> updateJobCard(@PathVariable String id, @RequestBody JobCard jobCard) {
        jobCard.setId(id);
        JobCard updated = jobCardService.createOrUpdateJobCard(jobCard);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<JobCard> updateStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String note = payload.get("note");
        JobCard updated = jobCardService.updateStatus(id, status, note);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/payment")
    public ResponseEntity<JobCard> updatePayment(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        BigDecimal advancePaid = new BigDecimal(payload.get("advancePaid").toString());
        String paymentStatus = payload.get("paymentStatus") != null ? payload.get("paymentStatus").toString() : null;
        String billNo = payload.get("billNo") != null ? payload.get("billNo").toString() : null;

        JobCard updated = jobCardService.updatePayment(id, advancePaid, paymentStatus, billNo);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<JobCard> duplicateJobCard(@PathVariable String id) {
        JobCard duplicated = jobCardService.duplicateJobCard(id);
        return new ResponseEntity<>(duplicated, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobCard(@PathVariable String id) {
        jobCardService.deleteJobCard(id);
        return ResponseEntity.noContent().build();
    }
}
