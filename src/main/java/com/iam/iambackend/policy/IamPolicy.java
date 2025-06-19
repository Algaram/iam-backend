package com.iam.iambackend.policy;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;


// mapping json fields statements/versions
// each statement representing one permission rule
@Data
public class IamPolicy {
    @JsonProperty("Version")
    private String version;
    
    @JsonProperty("Statement")
    private List<Statement> statement;
}