package com.saigraphics.jobcard.service;

import com.saigraphics.jobcard.exception.ResourceNotFoundException;
import com.saigraphics.jobcard.model.Employee;
import com.saigraphics.jobcard.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final ActivityLogService activityLogService;

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(String id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", "id", id));
    }

    @Transactional
    public Employee createOrUpdateEmployee(Employee employee) {
        if (employee.getId() != null && employeeRepository.existsById(employee.getId())) {
            Employee existing = getEmployeeById(employee.getId());
            existing.setName(employee.getName());
            existing.setRole(employee.getRole());
            existing.setPhone(employee.getPhone());
            Employee saved = employeeRepository.save(existing);
            activityLogService.addLog("Employee Updated", "Updated staff record for " + saved.getName() + " (" + saved.getRole() + ")", saved.getId(), "Employee");
            return saved;
        } else {
            if (employee.getId() == null) {
                employee.setId("emp-" + System.currentTimeMillis());
            }
            if (employee.getCreatedAt() == null) {
                employee.setCreatedAt(LocalDateTime.now());
            }
            Employee saved = employeeRepository.save(employee);
            activityLogService.addLog("Employee Added", "Registered press operator " + saved.getName() + " (" + saved.getRole() + ")", saved.getId(), "Employee");
            return saved;
        }
    }

    @Transactional
    public void deleteEmployee(String id) {
        Employee emp = getEmployeeById(id);
        employeeRepository.delete(emp);
        activityLogService.addLog("Employee Removed", "Removed operator " + emp.getName() + " from staff list", id, "Employee");
    }
}
