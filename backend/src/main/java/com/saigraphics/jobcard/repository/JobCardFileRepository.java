package com.saigraphics.jobcard.repository;

import com.saigraphics.jobcard.model.JobCardFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobCardFileRepository extends JpaRepository<JobCardFile, String> {
    List<JobCardFile> findByJobCardId(String jobCardId);
}
