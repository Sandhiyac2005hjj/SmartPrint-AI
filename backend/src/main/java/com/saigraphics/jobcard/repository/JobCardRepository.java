package com.saigraphics.jobcard.repository;

import com.saigraphics.jobcard.model.JobCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobCardRepository extends JpaRepository<JobCard, String> {
    Optional<JobCard> findByJobNo(String jobNo);
    List<JobCard> findByStatus(String status);
    List<JobCard> findByCustomerId(String customerId);
    
    @Query("SELECT j FROM JobCard j ORDER BY j.createdAt DESC")
    List<JobCard> findAllOrderedByCreatedAtDesc();
    
    long count();
}
