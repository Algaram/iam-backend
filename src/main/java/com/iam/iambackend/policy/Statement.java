package com.iam.iambackend.policy;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

// finds which statement within the IAM polciy 

@Data
public class Statement {
    @JsonProperty("Sid") // statement id
    private String sid;
    
    @JsonProperty("Effect") // allow or deny access
    private String effect;
    
    @JsonProperty("Principal") // which user roles or services it applies to
    private Object principal;
    
    @JsonProperty("Action") // which actions are allowed/denied
    private Object action;
    
    @JsonProperty("Resource") // aws resource 
    private Object resource;
    
    @JsonProperty("Condition") // any aditional conditions that is required
    private Object condition;
}