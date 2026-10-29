package com.saigraphics.jobcard.repository;

import com.saigraphics.jobcard.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByCustomerCode(String customerCode);
    List<Customer> findByNameContainingIgnoreCaseOrCompanyContainingIgnoreCaseOrPhoneContainingIgnoreCase(
            String name, String company, String phone);
}
