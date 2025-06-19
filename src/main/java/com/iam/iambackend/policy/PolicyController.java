package com.iam.iambackend.policy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// REST controller that handles iam policy related http request
// spring automaticall calls on a PolicyService instance

@RestController // spring handles http request and returns json
@RequestMapping("/policy") // all endpoints with /policy
public class PolicyController {

    @Autowired
    private PolicyService policyService;

    @PostMapping("/upload") // maaps to POST/policy/upload
    public ResponseEntity<?> uploadPolicy(@RequestBody PolicyUploadRequest request) {
        try {
            PolicySummary summary = policyService.parseAndAnalyzePolicy(request.getPolicyJson()); // parsing and analysis
            return ResponseEntity.ok(summary); // returns as json summary
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Error parsing policy: " + e.getMessage()); // catch for any error message
        }
    }

    @GetMapping("/test") // maps to GET/policy/test to check if controller is working
    public String test() {
        return "Policy controller is working!";
    }
}