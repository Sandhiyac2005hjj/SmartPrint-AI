package com.saigraphics.jobcard.service;

import com.saigraphics.jobcard.exception.ResourceNotFoundException;
import com.saigraphics.jobcard.model.*;
import com.saigraphics.jobcard.repository.JobCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobCardService {

    private final JobCardRepository jobCardRepository;
    private final CompanySettingsService settingsService;
    private final ActivityLogService activityLogService;

    public List<JobCard> getAllJobCards() {
        return jobCardRepository.findAllOrderedByCreatedAtDesc();
    }

    public JobCard getJobCardById(String id) {
        return jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JobCard", "id", id));
    }

    public String generateNextJobNo() {
        CompanySettings settings = settingsService.getSettings();
        long count = jobCardRepository.count();
        String padded = String.format("%04d", count + 1);
        return settings.getJobPrefix() + padded;
    }

    @Transactional
    public JobCard createOrUpdateJobCard(JobCard jobCard) {
        LocalDateTime now = LocalDateTime.now();

        if (jobCard.getId() != null && jobCardRepository.existsById(jobCard.getId())) {
            JobCard existing = getJobCardById(jobCard.getId());
            
            existing.setCustomerId(jobCard.getCustomerId());
            existing.setCustomerName(jobCard.getCustomerName());
            existing.setCompany(jobCard.getCompany());
            existing.setPhone(jobCard.getPhone());
            existing.setJobType(jobCard.getJobType());
            existing.setProductName(jobCard.getProductName());
            existing.setDescription(jobCard.getDescription());
            existing.setQuantity(jobCard.getQuantity());
            
            if (jobCard.getPaperDetails() != null) existing.setPaperDetails(jobCard.getPaperDetails());
            if (jobCard.getPrintDetails() != null) existing.setPrintDetails(jobCard.getPrintDetails());
            if (jobCard.getProduction() != null) existing.setProduction(jobCard.getProduction());
            
            existing.setJobDate(jobCard.getJobDate());
            existing.setExpectedDeliveryDate(jobCard.getExpectedDeliveryDate());
            existing.setPredictedCompletionDate(jobCard.getPredictedCompletionDate());
            existing.setPredictedDays(jobCard.getPredictedDays());
            existing.setStatus(jobCard.getStatus());
            
            if (jobCard.getBilling() != null) {
                BillingDetails b = jobCard.getBilling();
                BigDecimal selling = b.getSellingPrice() != null ? b.getSellingPrice() : BigDecimal.ZERO;
                BigDecimal advance = b.getAdvancePaid() != null ? b.getAdvancePaid() : BigDecimal.ZERO;
                BigDecimal balance = selling.subtract(advance);
                b.setBalanceAmount(balance.max(BigDecimal.ZERO));
                existing.setBilling(b);
            }

            existing.setRemarks(jobCard.getRemarks());
            existing.setIsDraft(jobCard.getIsDraft() != null ? jobCard.getIsDraft() : false);
            existing.setUpdatedAt(now);

            JobCard saved = jobCardRepository.save(existing);
            activityLogService.addLog("Job Card Updated", "Updated Job #" + saved.getJobNo() + " (" + saved.getProductName() + ")", saved.getId(), "JobCard");
            return saved;
        } else {
            if (jobCard.getId() == null) {
                jobCard.setId("jc-" + System.currentTimeMillis());
            }
            if (jobCard.getJobNo() == null || jobCard.getJobNo().isEmpty()) {
                jobCard.setJobNo(generateNextJobNo());
            }
            if (jobCard.getJobDate() == null) {
                jobCard.setJobDate(LocalDate.now().toString());
            }
            if (jobCard.getExpectedDeliveryDate() == null) {
                jobCard.setExpectedDeliveryDate(LocalDate.now().plusDays(3).toString());
            }
            if (jobCard.getStatus() == null) {
                jobCard.setStatus("Pending");
            }
            
            // Recalculate balance
            if (jobCard.getBilling() != null) {
                BillingDetails b = jobCard.getBilling();
                BigDecimal selling = b.getSellingPrice() != null ? b.getSellingPrice() : BigDecimal.ZERO;
                BigDecimal advance = b.getAdvancePaid() != null ? b.getAdvancePaid() : BigDecimal.ZERO;
                b.setBalanceAmount(selling.subtract(advance).max(BigDecimal.ZERO));
                if (b.getPaymentStatus() == null) {
                    b.setPaymentStatus(advance.compareTo(selling) >= 0 ? "Paid" : advance.compareTo(BigDecimal.ZERO) > 0 ? "Partial" : "Pending");
                }
            }

            // Timeline initial event
            if (jobCard.getTimeline() == null || jobCard.getTimeline().isEmpty()) {
                List<TimelineEvent> timeline = new ArrayList<>();
                CompanySettings settings = settingsService.getSettings();
                timeline.add(TimelineEvent.builder()
                        .id("t-" + System.currentTimeMillis())
                        .jobCardId(jobCard.getId())
                        .status(jobCard.getStatus())
                        .timestamp(now)
                        .note("Job Card created and registered into backend database.")
                        .updatedBy(settings.getOwnerName())
                        .build());
                jobCard.setTimeline(timeline);
            }

            jobCard.setCreatedAt(now);
            jobCard.setUpdatedAt(now);

            JobCard saved = jobCardRepository.save(jobCard);
            activityLogService.addLog("Job Card Created", "Created Job #" + saved.getJobNo() + " for " + saved.getCustomerName(), saved.getId(), "JobCard");
            return saved;
        }
    }

    @Transactional
    public JobCard updateStatus(String id, String status, String note) {
        JobCard jobCard = getJobCardById(id);
        CompanySettings settings = settingsService.getSettings();

        jobCard.setStatus(status);
        
        TimelineEvent event = TimelineEvent.builder()
                .id("t-" + System.currentTimeMillis())
                .jobCardId(id)
                .status(status)
                .timestamp(LocalDateTime.now())
                .note(note != null && !note.isEmpty() ? note : "Status transitioned to " + status)
                .updatedBy(settings.getOwnerName())
                .build();

        jobCard.getTimeline().add(event);
        jobCard.setUpdatedAt(LocalDateTime.now());

        JobCard saved = jobCardRepository.save(jobCard);
        activityLogService.addLog("Status Update", "Job #" + saved.getJobNo() + " status changed to " + status, id, "JobCard");
        return saved;
    }

    @Transactional
    public JobCard updatePayment(String id, BigDecimal advancePaid, String paymentStatus, String billNo) {
        JobCard jobCard = getJobCardById(id);
        BillingDetails billing = jobCard.getBilling();
        if (billing == null) {
            billing = new BillingDetails();
        }

        BigDecimal selling = billing.getSellingPrice() != null ? billing.getSellingPrice() : BigDecimal.ZERO;
        BigDecimal balance = selling.subtract(advancePaid).max(BigDecimal.ZERO);

        billing.setAdvancePaid(advancePaid);
        billing.setBalanceAmount(balance);
        if (billNo != null) billing.setBillNo(billNo);

        if (paymentStatus != null) {
            billing.setPaymentStatus(paymentStatus);
        } else {
            billing.setPaymentStatus(advancePaid.compareTo(selling) >= 0 ? "Paid" : advancePaid.compareTo(BigDecimal.ZERO) > 0 ? "Partial" : "Pending");
        }

        jobCard.setBilling(billing);
        jobCard.setUpdatedAt(LocalDateTime.now());

        JobCard saved = jobCardRepository.save(jobCard);
        activityLogService.addLog("Payment Recorded", "Payment updated for Job #" + saved.getJobNo() + ": Paid ₹" + advancePaid + ", Balance ₹" + balance + " (" + billing.getPaymentStatus() + ")", id, "JobCard");
        return saved;
    }

    @Transactional
    public JobCard duplicateJobCard(String id) {
        JobCard original = getJobCardById(id);

        JobCard duplicate = JobCard.builder()
                .id("jc-" + System.currentTimeMillis())
                .jobNo(generateNextJobNo())
                .customerId(original.getCustomerId())
                .customerName(original.getCustomerName())
                .company(original.getCompany())
                .phone(original.getPhone())
                .jobType(original.getJobType())
                .productName(original.getProductName() + " (Copy)")
                .description(original.getDescription())
                .quantity(original.getQuantity())
                .paperDetails(original.getPaperDetails())
                .printDetails(original.getPrintDetails())
                .production(original.getProduction())
                .jobDate(LocalDate.now().toString())
                .expectedDeliveryDate(LocalDate.now().plusDays(3).toString())
                .status("Pending")
                .billing(BillingDetails.builder()
                        .estimatedCost(original.getBilling() != null ? original.getBilling().getEstimatedCost() : BigDecimal.ZERO)
                        .sellingPrice(original.getBilling() != null ? original.getBilling().getSellingPrice() : BigDecimal.ZERO)
                        .advancePaid(BigDecimal.ZERO)
                        .balanceAmount(original.getBilling() != null ? original.getBilling().getSellingPrice() : BigDecimal.ZERO)
                        .paymentStatus("Pending")
                        .build())
                .remarks(original.getRemarks())
                .isDraft(false)
                .build();

        return createOrUpdateJobCard(duplicate);
    }

    @Transactional
    public void deleteJobCard(String id) {
        JobCard jc = getJobCardById(id);
        jobCardRepository.delete(jc);
        activityLogService.addLog("Job Card Deleted", "Deleted Job #" + jc.getJobNo(), id, "JobCard");
    }
}
