package com.prakash.gateaway_service.Service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminPasswordPolicyTest {

    private AdminPasswordPolicy policy;

    @BeforeEach
    void setUp() {
        policy = new AdminPasswordPolicy();
    }

    @Test
    void rejectsTooShortPassword() {
        assertFalse(policy.validate("owner", "Short7!").valid());
    }

    @Test
    void rejectsBlankPassword() {
        assertFalse(policy.validate("owner", "   ").valid());
    }

    @Test
    void rejectsCommonPassword() {
        assertFalse(policy.validate("owner", "password123").valid());
    }

    @Test
    void rejectsDemoPassword() {
        assertFalse(policy.validate("owner", "admin123").valid());
    }

    @Test
    void rejectsUsernameContainingPassword() {
        assertFalse(policy.validate("owner", "north owner harbor 2026").valid());
    }

    @Test
    void rejectsVeryLowStrengthPassword() {
        assertFalse(policy.validate("owner", "aaaaaaaaaaaa").valid());
    }

    @Test
    void rejectsLeadingAndTrailingWhitespace() {
        assertFalse(policy.validate("owner", " coastal gateway passphrase 2026! ").valid());
    }

    @Test
    void acceptsStrongPassphrase() {
        assertTrue(policy.validate("owner", "coastal gateway passphrase 2026!").valid());
    }

    @Test
    void acceptsStrongRandomLookingPassword() {
        assertTrue(policy.validate("owner", "D9v$kL2pQ8mR").valid());
    }
}
