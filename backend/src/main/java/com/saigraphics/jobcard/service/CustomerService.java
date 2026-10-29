package com.saigraphics.jobcard.service;

import com.saigraphics.jobcard.exception.ResourceNotFoundException;
import com.saigraphics.jobcard.model.Customer;
import com.saigraphics.jobcard.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final ActivityLogService activityLogService;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getCustomerById(String id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
    }

    @Transactional
    public Customer createOrUpdateCustomer(Customer customer) {
        if (customer.getId() != null && customerRepository.existsById(customer.getId())) {
            Customer existing = getCustomerById(customer.getId());
            existing.setName(customer.getName());
            existing.setCompany(customer.getCompany());
            existing.setPhone(customer.getPhone());
            existing.setAltPhone(customer.getAltPhone());
            existing.setEmail(customer.getEmail());
            existing.setGstNumber(customer.getGstNumber());
            existing.setAddress(customer.getAddress());
            existing.setNotes(customer.getNotes());
            Customer saved = customerRepository.save(existing);
            activityLogService.addLog("Customer Updated", "Updated customer " + saved.getName() + " (" + saved.getCompany() + ")", saved.getId(), "Customer");
            return saved;
        } else {
            if (customer.getId() == null) {
                customer.setId("cust-" + System.currentTimeMillis());
            }
            if (customer.getCustomerCode() == null || customer.getCustomerCode().isEmpty()) {
                long count = customerRepository.count();
                customer.setCustomerCode("CUST-" + (1000 + count + 1));
            }
            if (customer.getCreatedAt() == null) {
                customer.setCreatedAt(LocalDateTime.now());
            }
            Customer saved = customerRepository.save(customer);
            activityLogService.addLog("Customer Added", "Added customer " + saved.getName() + " (" + saved.getCompany() + ")", saved.getId(), "Customer");
            return saved;
        }
    }

    @Transactional
    public void deleteCustomer(String id) {
        Customer customer = getCustomerById(id);
        customerRepository.delete(customer);
        activityLogService.addLog("Customer Deleted", "Deleted customer " + customer.getName(), id, "Customer");
    }
}
