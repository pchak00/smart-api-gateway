package com.prakash.gateaway_service.Service;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class AdminPasswordPolicy {
    public static final int MIN_LENGTH = 12;
    public static final int MAX_LENGTH = 128;

    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "password",
            "password1",
            "password123",
            "admin",
            "admin123",
            "owner",
            "owner123",
            "pacific",
            "pacific123",
            "demo",
            "demo123",
            "changeme",
            "letmein",
            "qwerty",
            "qwerty123",
            "123456",
            "12345678",
            "123456789",
            "newstrongpassword123"
    );

    private static final Pattern COMMON_PREFIX_PATTERN =
            Pattern.compile("^(password|admin|owner|pacific|demo|qwerty|letmein|changeme)[0-9!@#$%^&*._-]*$");
    private static final Pattern REPEATED_CHARACTER_PATTERN = Pattern.compile("(.)\\1{3,}");
    private static final List<String> SEQUENCES = List.of(
            "0123", "1234", "2345", "3456", "4567", "5678", "6789",
            "abcd", "bcde", "cdef", "defg", "qwer", "wert", "asdf", "sdfg", "zxcv"
    );

    public ValidationResult validate(String username, String password) {
        if (password == null) {
            return invalid("Password is required.");
        }

        if (password.isBlank()) {
            return invalid("Password is required.");
        }

        if (!password.equals(password.strip())) {
            return invalid("Do not start or end the password with spaces.");
        }

        if (password.length() < MIN_LENGTH) {
            return invalid("Use at least 12 characters.");
        }

        if (password.length() > MAX_LENGTH) {
            return invalid("Use 128 characters or fewer.");
        }

        if (containsUsername(username, password)) {
            return invalid("Avoid using the username in the password.");
        }

        if (isCommonPassword(password)) {
            return invalid("Avoid common or demo passwords.");
        }

        Strength strength = score(password);
        if (strength == Strength.WEAK) {
            return invalid("Try a longer passphrase or a less predictable password.");
        }

        return new ValidationResult(true, strength, strength.defaultFeedback());
    }

    private ValidationResult invalid(String feedback) {
        return new ValidationResult(false, Strength.WEAK, feedback);
    }

    private boolean containsUsername(String username, String password) {
        if (username == null || username.isBlank()) {
            return false;
        }

        String normalizedPassword = normalizeLettersAndDigits(password);
        String normalizedUsername = normalizeLettersAndDigits(username);

        if (normalizedUsername.length() >= 3 && normalizedPassword.contains(normalizedUsername)) {
            return true;
        }

        String[] usernameParts = username.toLowerCase(Locale.ROOT).split("[^a-z0-9]+");
        for (String part : usernameParts) {
            if (part.length() >= 4 && normalizedPassword.contains(part)) {
                return true;
            }
        }

        return false;
    }

    private boolean isCommonPassword(String password) {
        String normalized = normalizeLettersAndDigits(password);
        String lower = password.toLowerCase(Locale.ROOT).trim();

        return COMMON_PASSWORDS.contains(normalized) ||
                COMMON_PASSWORDS.contains(lower) ||
                COMMON_PREFIX_PATTERN.matcher(normalized).matches();
    }

    private Strength score(String password) {
        int score = Math.min(45, password.length() * 2);
        int varietyCount = 0;

        if (password.chars().anyMatch(Character::isLowerCase)) {
            varietyCount++;
        }
        if (password.chars().anyMatch(Character::isUpperCase)) {
            varietyCount++;
        }
        if (password.chars().anyMatch(Character::isDigit)) {
            varietyCount++;
        }
        if (password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch) && !Character.isWhitespace(ch))) {
            varietyCount++;
        }
        if (password.chars().anyMatch(Character::isWhitespace)) {
            varietyCount++;
        }

        score += varietyCount * 8;

        long uniqueChars = password.toLowerCase(Locale.ROOT).chars().distinct().count();
        score += (int) Math.min(20, uniqueChars * 2);

        String[] words = password.strip().split("\\s+");
        if (words.length >= 3 && password.length() >= 20) {
            score += 20;
        }

        String lower = password.toLowerCase(Locale.ROOT);
        if (REPEATED_CHARACTER_PATTERN.matcher(lower).find()) {
            score -= 25;
        }
        if (containsSequence(lower)) {
            score -= 25;
        }
        if (uniqueChars <= 4) {
            score -= 20;
        }
        if (containsCommonTerm(lower)) {
            score -= 15;
        }

        if (score >= 90) {
            return Strength.VERY_STRONG;
        }
        if (score >= 70) {
            return Strength.STRONG;
        }
        if (score >= 50) {
            return Strength.FAIR;
        }
        return Strength.WEAK;
    }

    private boolean containsSequence(String lowerPassword) {
        String normalized = normalizeLettersAndDigits(lowerPassword);
        return SEQUENCES.stream().anyMatch(normalized::contains);
    }

    private boolean containsCommonTerm(String lowerPassword) {
        return lowerPassword.contains("password") ||
                lowerPassword.contains("qwerty") ||
                lowerPassword.contains("letmein") ||
                lowerPassword.contains("changeme");
    }

    private String normalizeLettersAndDigits(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    public record ValidationResult(boolean valid, Strength strength, String feedback) {
    }

    public enum Strength {
        WEAK("Weak", "Try a longer passphrase."),
        FAIR("Fair", "A longer passphrase would be stronger."),
        STRONG("Strong", "Password meets the admin policy."),
        VERY_STRONG("Very strong", "Password meets the admin policy.");

        private final String label;
        private final String defaultFeedback;

        Strength(String label, String defaultFeedback) {
            this.label = label;
            this.defaultFeedback = defaultFeedback;
        }

        public String label() {
            return label;
        }

        public String defaultFeedback() {
            return defaultFeedback;
        }
    }
}
