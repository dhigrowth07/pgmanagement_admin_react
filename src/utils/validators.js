/**
 * Centralized Validation Utilities
 *
 * This module provides reusable validation functions and Ant Design Form rules
 * for consistent validation across the application.
 */

// ============================================================================
// VALIDATION FUNCTIONS (Pure functions for programmatic validation)
// ============================================================================

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @param {number} minLength - Minimum length (default: 6)
 * @returns {boolean} - True if valid password
 */
export const isValidPassword = (password, minLength = 6) => {
  if (typeof password !== "string") return false;
  return password.trim().length >= minLength;
};

/**
 * Validates phone number (7-15 digits)
 * @param {string} phone - Phone number to validate
 * @param {number} exactLength - Optional exact length requirement
 * @returns {boolean} - True if valid phone
 */
export const isValidPhone = (phone, exactLength = null) => {
  if (typeof phone !== "string") return false;
  const trimmed = phone.trim().replace(/[\s\-\(\)]/g, ""); // Remove common formatting
  if (exactLength) {
    return /^[0-9]+$/.test(trimmed) && trimmed.length === exactLength;
  }
  return /^[0-9]{7,15}$/.test(trimmed);
};

/**
 * Validates Indian phone number (10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid Indian phone
 */
export const isValidIndianPhone = (phone) => {
  return isValidPhone(phone, 10);
};

/**
 * Validates UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} - True if valid UUID
 */
export const isValidUUID = (uuid) => {
  if (typeof uuid !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
};

/**
 * Validates required field
 * @param {any} value - Value to check
 * @param {boolean} allowWhitespace - Allow whitespace-only strings (default: false)
 * @returns {boolean} - True if value exists
 */
export const isRequired = (value, allowWhitespace = false) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    return allowWhitespace ? value.length > 0 : value.trim().length > 0;
  }
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validates minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} - True if meets minimum length
 */
export const hasMinLength = (value, minLength) => {
  if (typeof value !== "string") return false;
  return value.trim().length >= minLength;
};

/**
 * Validates maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if within maximum length
 */
export const hasMaxLength = (value, maxLength) => {
  if (typeof value !== "string") return false;
  return value.trim().length <= maxLength;
};

/**
 * Validates numeric value
 * @param {any} value - Value to validate
 * @param {boolean} allowDecimal - Allow decimal numbers (default: true)
 * @returns {boolean} - True if valid number
 */
export const isNumeric = (value, allowDecimal = true) => {
  if (typeof value === "number") return true;
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const regex = allowDecimal ? /^-?\d*\.?\d+$/ : /^-?\d+$/;
  return regex.test(trimmed);
};

/**
 * Validates positive number
 * @param {any} value - Value to validate
 * @returns {boolean} - True if positive number
 */
export const isPositiveNumber = (value) => {
  if (!isNumeric(value)) return false;
  const num = typeof value === "string" ? parseFloat(value.trim()) : value;
  return num > 0;
};

/**
 * Validates non-negative number (>= 0)
 * @param {any} value - Value to validate
 * @returns {boolean} - True if non-negative number
 */
export const isNonNegativeNumber = (value) => {
  if (!isNumeric(value)) return false;
  const num = typeof value === "string" ? parseFloat(value.trim()) : value;
  return num >= 0;
};

/**
 * Validates date string
 * @param {string} date - Date string to validate
 * @returns {boolean} - True if valid date
 */
export const isValidDate = (date) => {
  if (typeof date !== "string") return false;
  const parsed = Date.parse(date);
  return !isNaN(parsed);
};

/**
 * Validates that date is in the past
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return false;
  return dateObj < new Date();
};

/**
 * Validates that date is in the future
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if date is in the future
 */
export const isFutureDate = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return false;
  return dateObj > new Date();
};

// ============================================================================
// ANT DESIGN FORM RULES (Ready-to-use validation rules)
// ============================================================================

/**
 * Required field rule
 * @param {string} message - Custom error message
 * @returns {Array} - Ant Design rule array
 */
export const requiredRule = (message = "This field is required") => [{ required: true, message }];

/**
 * Email validation rule
 * @param {boolean} isRequired - Whether email is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @param {string} invalidMessage - Custom invalid format message
 * @returns {Array} - Ant Design rule array
 */
export const emailRules = (isRequired = true, requiredMessage = "Please enter your email", invalidMessage = "Please enter a valid email address") => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  rules.push({ type: "email", message: invalidMessage });
  return rules;
};

/**
 * Phone number validation rule (10 digits for Indian numbers)
 * @param {boolean} isRequired - Whether phone is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @param {string} invalidMessage - Custom invalid format message
 * @param {number} exactLength - Exact length requirement (default: 10)
 * @returns {Array} - Ant Design rule array
 */
export const phoneRules = (isRequired = true, requiredMessage = "Please enter phone number", invalidMessage = "Phone number must be 10 digits", exactLength = 10) => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  rules.push({
    pattern: new RegExp(`^[0-9]{${exactLength}}$`),
    message: invalidMessage,
  });
  return rules;
};

/**
 * Optional phone number validation rule
 * @param {string} invalidMessage - Custom invalid format message
 * @param {number} exactLength - Exact length requirement (default: 10)
 * @returns {Array} - Ant Design rule array
 */
export const optionalPhoneRules = (invalidMessage = "Must be a valid 10-digit number", exactLength = 10) => [
  {
    pattern: new RegExp(`^[0-9]{${exactLength}}$`),
    message: invalidMessage,
  },
];

/**
 * Password validation rule
 * @param {boolean} isRequired - Whether password is required (default: true)
 * @param {number} minLength - Minimum length (default: 6)
 * @param {string} requiredMessage - Custom required message
 * @param {string} minLengthMessage - Custom min length message
 * @returns {Array} - Ant Design rule array
 */
export const passwordRules = (isRequired = true, minLength = 6, requiredMessage = "Please enter password", minLengthMessage = null) => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  rules.push({
    min: minLength,
    message: minLengthMessage || `Password must be at least ${minLength} characters`,
  });
  return rules;
};

/**
 * Name/Full name validation rule
 * @param {boolean} isRequired - Whether name is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @param {number} minLength - Minimum length (default: 2)
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {Array} - Ant Design rule array
 */
export const nameRules = (isRequired = true, requiredMessage = "Please enter name", minLength = 2, maxLength = 100) => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  if (minLength > 0) {
    rules.push({
      min: minLength,
      message: `Name must be at least ${minLength} characters`,
    });
  }
  if (maxLength > 0) {
    rules.push({
      max: maxLength,
      message: `Name must not exceed ${maxLength} characters`,
    });
  }
  return rules;
};

/**
 * UUID validation rule
 * @param {boolean} isRequired - Whether UUID is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @param {string} invalidMessage - Custom invalid format message
 * @returns {Array} - Ant Design rule array
 */
export const uuidRules = (isRequired = true, requiredMessage = "This field is required", invalidMessage = "Invalid format") => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  rules.push({
    validator: (_, value) => {
      if (!value || isValidUUID(value)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(invalidMessage));
    },
  });
  return rules;
};

/**
 * Number validation rule
 * @param {boolean} isRequired - Whether number is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @param {string} invalidMessage - Custom invalid format message
 * @param {boolean} allowDecimal - Allow decimal numbers (default: true)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array} - Ant Design rule array
 */
export const numberRules = (isRequired = true, requiredMessage = "Please enter a number", invalidMessage = "Please enter a valid number", allowDecimal = true, min = null, max = null) => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  rules.push({
    validator: (_, value) => {
      if (!value) {
        return isRequired ? Promise.reject(new Error(requiredMessage)) : Promise.resolve();
      }
      if (!isNumeric(value, allowDecimal)) {
        return Promise.reject(new Error(invalidMessage));
      }
      const num = parseFloat(value);
      if (min !== null && num < min) {
        return Promise.reject(new Error(`Value must be at least ${min}`));
      }
      if (max !== null && num > max) {
        return Promise.reject(new Error(`Value must not exceed ${max}`));
      }
      return Promise.resolve();
    },
  });
  return rules;
};

/**
 * Positive number validation rule
 * @param {boolean} isRequired - Whether number is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @param {string} invalidMessage - Custom invalid format message
 * @returns {Array} - Ant Design rule array
 */
export const positiveNumberRules = (isRequired = true, requiredMessage = "Please enter a number", invalidMessage = "Please enter a positive number") => {
  return numberRules(isRequired, requiredMessage, invalidMessage, true, 0.01);
};

/**
 * Non-negative number validation rule (>= 0)
 * @param {boolean} isRequired - Whether number is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @param {string} invalidMessage - Custom invalid format message
 * @returns {Array} - Ant Design rule array
 */
export const nonNegativeNumberRules = (isRequired = true, requiredMessage = "Please enter a number", invalidMessage = "Please enter a non-negative number") => {
  return numberRules(isRequired, requiredMessage, invalidMessage, true, 0);
};

/**
 * Date validation rule
 * @param {boolean} isRequired - Whether date is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @param {boolean} mustBePast - Date must be in the past (default: false)
 * @param {boolean} mustBeFuture - Date must be in the future (default: false)
 * @returns {Array} - Ant Design rule array
 */
export const dateRules = (isRequired = true, requiredMessage = "Please select a date", mustBePast = false, mustBeFuture = false) => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  if (mustBePast || mustBeFuture) {
    rules.push({
      validator: (_, value) => {
        if (!value) {
          return isRequired ? Promise.reject(new Error(requiredMessage)) : Promise.resolve();
        }
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) {
          return Promise.reject(new Error("Please enter a valid date"));
        }
        if (mustBePast && !isPastDate(date)) {
          return Promise.reject(new Error("Date must be in the past"));
        }
        if (mustBeFuture && !isFutureDate(date)) {
          return Promise.reject(new Error("Date must be in the future"));
        }
        return Promise.resolve();
      },
    });
  }
  return rules;
};

/**
 * Text length validation rule
 * @param {boolean} isRequired - Whether text is required (default: true)
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} requiredMessage - Custom required message
 * @returns {Array} - Ant Design rule array
 */
export const textLengthRules = (isRequired = true, minLength = null, maxLength = null, requiredMessage = "This field is required") => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  if (minLength !== null && minLength > 0) {
    rules.push({
      min: minLength,
      message: `Must be at least ${minLength} characters`,
    });
  }
  if (maxLength !== null && maxLength > 0) {
    rules.push({
      max: maxLength,
      message: `Must not exceed ${maxLength} characters`,
    });
  }
  return rules;
};

/**
 * Custom pattern validation rule
 * @param {RegExp|string} pattern - Regex pattern
 * @param {string} message - Error message
 * @param {boolean} isRequired - Whether field is required (default: true)
 * @param {string} requiredMessage - Custom required message
 * @returns {Array} - Ant Design rule array
 */
export const patternRules = (pattern, message, isRequired = true, requiredMessage = "This field is required") => {
  const rules = [];
  if (isRequired) {
    rules.push({ required: true, message: requiredMessage });
  }
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  rules.push({ pattern: regex, message });
  return rules;
};

// ============================================================================
// COMMON VALIDATION RULE SETS (Pre-configured for common use cases)
// ============================================================================

/**
 * Tenant ID validation rules
 */
export const tenantIdRules = requiredRule("Please enter Tenant ID");

/**
 * Admin email validation rules
 */
export const adminEmailRules = emailRules(true, "Please input your Email!", "Please enter a valid email address!");

/**
 * Admin password validation rules (min 6 chars)
 */
export const adminPasswordRules = passwordRules(true, 6, "Please input your Password!", "Password must be at least 6 characters");

/**
 * Customer name validation rules
 */
export const customerNameRules = nameRules(true, "Please enter full name");

/**
 * Customer email validation rules
 */
export const customerEmailRules = emailRules(true, "Please enter email", "Enter a valid email address");

/**
 * Customer phone validation rules (10 digits)
 */
export const customerPhoneRules = phoneRules(true, "Please enter phone number", "Phone number must be 10 digits", 10);

/**
 * Emergency contact phone rules (optional, 10 digits)
 */
export const emergencyPhoneRules = optionalPhoneRules("Must be a valid 10-digit number", 10);

/**
 * Customer password validation rules (min 6 chars)
 */
export const customerPasswordRules = passwordRules(true, 6, "Please set a password", "Password must be at least 6 characters");

/**
 * User onboarding password rules (min 8 chars)
 */
export const onboardingPasswordRules = passwordRules(true, 8, "Please create a password", "Password must be at least 8 characters");

/**
 * Date of birth validation rules (required, must be past)
 */
export const dobRules = dateRules(
  true,
  "Please select your date of birth",
  true, // must be past
  false
);

/**
 * Gender selection rules
 */
export const genderRules = requiredRule("Please select gender");

/**
 * Amount/Price validation rules (positive number)
 */
export const amountRules = positiveNumberRules(true, "Please enter an amount", "Amount must be a positive number");

/**
 * Non-negative amount rules (for balances, etc.)
 */
export const balanceRules = nonNegativeNumberRules(true, "Please enter an amount", "Amount must be a non-negative number");
