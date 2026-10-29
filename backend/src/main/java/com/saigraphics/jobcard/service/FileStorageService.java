package com.saigraphics.jobcard.service;

import com.saigraphics.jobcard.exception.ResourceNotFoundException;
import com.saigraphics.jobcard.model.JobCard;
import com.saigraphics.jobcard.model.JobCardFile;
import com.saigraphics.jobcard.repository.JobCardFileRepository;
import com.saigraphics.jobcard.repository.JobCardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    private final JobCardRepository jobCardRepository;
    private final JobCardFileRepository fileRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public JobCardFile storeFile(String jobCardId, MultipartFile file) throws IOException {
        JobCard jobCard = jobCardRepository.findById(jobCardId)
                .orElseThrow(() -> new ResourceNotFoundException("JobCard", "id", jobCardId));

        Path rootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(rootPath);

        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String storedFilename = UUID.randomUUID().toString() + fileExtension;
        Path targetLocation = rootPath.resolve(storedFilename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        String fileUrl = "/api/files/download/" + storedFilename;

        JobCardFile jobCardFile = JobCardFile.builder()
                .id("file-" + System.currentTimeMillis())
                .jobCardId(jobCardId)
                .name(originalFilename != null ? originalFilename : storedFilename)
                .size(file.getSize())
                .type(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .fileUrl(fileUrl)
                .uploadedAt(LocalDateTime.now())
                .build();

        JobCardFile savedFile = fileRepository.save(jobCardFile);
        jobCard.getFiles().add(savedFile);
        jobCardRepository.save(jobCard);

        activityLogService.addLog("File Uploaded", "Attached file " + savedFile.getName() + " to Job #" + jobCard.getJobNo(), jobCardId, "JobCard");
        return savedFile;
    }

    public Path loadFileAsPath(String filename) {
        Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
        if (!Files.exists(filePath)) {
            throw new ResourceNotFoundException("File", "filename", filename);
        }
        return filePath;
    }

    @Transactional
    public void deleteFile(String jobCardId, String fileId) {
        JobCard jobCard = jobCardRepository.findById(jobCardId)
                .orElseThrow(() -> new ResourceNotFoundException("JobCard", "id", jobCardId));

        JobCardFile fileToDelete = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("JobCardFile", "id", fileId));

        fileRepository.delete(fileToDelete);
        jobCard.getFiles().removeIf(f -> f.getId().equals(fileId));
        jobCardRepository.save(jobCard);

        activityLogService.addLog("File Deleted", "Removed attachment " + fileToDelete.getName() + " from Job #" + jobCard.getJobNo(), jobCardId, "JobCard");
    }
}
