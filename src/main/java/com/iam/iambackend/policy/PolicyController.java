package com.iam.iambackend.policy;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// accepts raw iam policies and wrapped ones
@RestController
@RequestMapping("/policy")
public class PolicyController {

    @Autowired
    private PolicyService policyService;
    
    // cnverts iam policy objects back to json
    @Autowired
    private ObjectMapper objectMapper;
    @PostMapping("/upload")
    public ResponseEntity<?> uploadPolicy(@RequestBody IamPolicy policy) {
        try {
            String policyJson = objectMapper.writeValueAsString(policy);
            PolicySummary summary = policyService.parseAndAnalyzePolicy(policyJson);
            return ResponseEntity.ok(summary);
        } 
        catch (Exception e) { // error check return
            return ResponseEntity.badRequest().body("Error parsing policy: " + e.getMessage());
        }
    }

    //wrapped format
    @PostMapping("/upload-wrapped")
    public ResponseEntity<?> uploadWrappedPolicy(@RequestBody PolicyUploadRequest request) {
        try {
            PolicySummary summary = policyService.parseAndAnalyzePolicy(request.getPolicyJson());
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error parsing policy: " + e.getMessage());
        }
    }

    //test check
    @GetMapping("/test")
    public String test() {
        return "Policy controller is working!";
    }
}