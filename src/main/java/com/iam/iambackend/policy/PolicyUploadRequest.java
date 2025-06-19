package com.iam.iambackend.policy;

import lombok.Data;

// request payload for when user uploads an iam policy
// policy changes to json string then readable policy name
@Data
public class PolicyUploadRequest {
    private String policyJson;
    private String policyName;
}