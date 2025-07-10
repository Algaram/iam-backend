// File: src/main/java/com/iam/iambackend/config/CorsConfig.java
package com.iam.iambackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        
        //allows server and local dev
        config.addAllowedOrigin("http://18.222.166.31:3000");
        config.addAllowedOrigin("http://localhost:5173");
        
        //allow all http methods
        config.addAllowedMethod("*");
        
        //allows all headers
        config.addAllowedHeader("*");
        
        //allows if creds needed
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}