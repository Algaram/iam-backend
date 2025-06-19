package com.iam.iambackend.policy;

import lombok.Data;
import java.util.List;
import java.util.Set;

// summary for policies
// collects policy version, total statements, total actions,
// total resources, principals with no duplicates
//simplifies statements

@Data
public class PolicySummary {
    private String policyVersion;
    private int totalStatements;
    private Set<String> uniqueActions;
    private Set<String> uniqueResources;
    private Set<String> principals;
    private List<StatementSummary> statements;
}