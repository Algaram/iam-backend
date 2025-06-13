package com.iam.iambackend;

import org.springframework.data.jpa.repository.JpaRepository;

// tells spring boot to use built-in database functions on user objects using their 
// long id

public interface UserRepository extends JpaRepository<User, Long> {
    // define custom queries here later, like:
    // Optional<User> findByUsername(String username);
}