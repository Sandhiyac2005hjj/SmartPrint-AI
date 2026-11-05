package com.saigraphics.jobcard.controller;

import com.saigraphics.jobcard.model.JobCardFile;
import com.saigraphics.jobcard.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload/{jobCardId}")
    public ResponseEntity<JobCardFile> uploadFile(
            @PathVariable String jobCardId,
            @RequestParam("file") MultipartFile file) {
        try {
            JobCardFile stored = fileStorageService.storeFile(jobCardId, file);
            return new ResponseEntity<>(stored, HttpStatus.CREATED);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/download/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.loadFileAsPath(filename);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() || resource.isReadable()) {
                String contentType = "application/octet-stream";
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{jobCardId}/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable String jobCardId,
            @PathVariable String fileId) {
        fileStorageService.deleteFile(jobCardId, fileId);
        return ResponseEntity.noContent().build();
    }
}
