package com.iam.iambackend.policy;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

// contains all logic for iam policy processing

@Service // allows spring to manage and make available to @Autowired
// spring boot uses @service as like annotation to call these objects
public class PolicyService {

    private final ObjectMapper objectMapper = new ObjectMapper(); // jackson mapper to convert json to objects

    public PolicySummary parseAndAnalyzePolicy(String policyJson) throws Exception {
        IamPolicy policy = objectMapper.readValue(policyJson, IamPolicy.class); // parsing json string into java
        
        PolicySummary summary = new PolicySummary(); // create new summary object to populate
        summary.setPolicyVersion(policy.getVersion());
        summary.setTotalStatements(policy.getStatement().size());
        
        // collections of data from all statements
        Set<String> allActions = new HashSet<>();
        Set<String> allResources = new HashSet<>();
        Set<String> allPrincipals = new HashSet<>();
        List<StatementSummary> statementSummaries = new ArrayList<>();
        
        // processing each statement in the policy
        for (Statement stmt : policy.getStatement()) {
            StatementSummary stmtSummary = processStatement(stmt); // front end friendly conversion
            statementSummaries.add(stmtSummary);
            
            // adding statement data to collections
            allActions.addAll(stmtSummary.getActions());
            allResources.addAll(stmtSummary.getResources());
            if (stmtSummary.getPrincipalSummary() != null) {
                allPrincipals.add(stmtSummary.getPrincipalSummary());
            }
        }
        
        // sets all data in the summary
        summary.setUniqueActions(allActions);
        summary.setUniqueResources(allResources);
        summary.setPrincipals(allPrincipals);
        summary.setStatements(statementSummaries);
        
        return summary;
    }

    // helper method
    //converting statement into statement summary
    // copies simple fields directly or meets other conditions if needed
    private StatementSummary processStatement(Statement stmt) {
        StatementSummary summary = new StatementSummary();
        
        summary.setSid(stmt.getSid());
        summary.setEffect(stmt.getEffect());
        summary.setHasConditions(stmt.getCondition() != null);
        summary.setActions(convertToStringList(stmt.getAction()));
        summary.setResources(convertToStringList(stmt.getResource()));
        summary.setPrincipalSummary(simplifyPrincipal(stmt.getPrincipal()));
        
        return summary;
    }

    // helper method
    // converts aws formats to List<String>
    private List<String> convertToStringList(Object value) {
        // null
        if (value == null) {
            return new ArrayList<>();
        }
        
        // single string converts to single item list
        if (value instanceof String) {
            return Arrays.asList((String) value);
        }
        
        // already a list converts to string
        if (value instanceof List) {
            return ((List<?>) value).stream()
                    .map(Object::toString)
                    .collect(Collectors.toList());
        }
        
        // something else then converts to sstring and wrap in list
        return Arrays.asList(value.toString());
    }

    // helper method
    // complex objects to simple display strings
    private String simplifyPrincipal(Object principal) {
        //null
        if (principal == null) {
            return null;
        }
        
        // simple string then ok
        if (principal instanceof String) {
            return (String) principal;
        }
        
        // if complex then create summary 
        //return to this if we want to pursue better parsing
        return "complex principal: " + principal.toString();
    }
}