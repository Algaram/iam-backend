package com.iam.iambackend.policy;

import lombok.Data;
import java.util.List;

// front end view of iam statement

@Data
public class StatementSummary {
    private String sid;
    private String effect;
    private List<String> actions;
    private List<String> resources;
    private String principalSummary;
    private boolean hasConditions; // indicates whether staement has conditions
}