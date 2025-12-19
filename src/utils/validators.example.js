/**
 * VALIDATORS USAGE EXAMPLES
 * 
 * This file demonstrates how to use the centralized validators
 * in your forms. This is a reference file - not meant to be imported.
 */

import {
  // Validation Functions
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidUUID,
  
  // Ant Design Form Rules
  requiredRule,
  emailRules,
  phoneRules,
  optionalPhoneRules,
  passwordRules,
  nameRules,
  uuidRules,
  numberRules,
  positiveNumberRules,
  dateRules,
  textLengthRules,
  patternRules,
  
  // Pre-configured Rule Sets
  tenantIdRules,
  adminEmailRules,
  adminPasswordRules,
  customerNameRules,
  customerEmailRules,
  customerPhoneRules,
  emergencyPhoneRules,
  customerPasswordRules,
  onboardingPasswordRules,
  dobRules,
  genderRules,
  amountRules,
  balanceRules,
} from "./validators";

// ============================================================================
// EXAMPLE 1: Using Pre-configured Rules (Easiest)
// ============================================================================

// Login Form
const LoginFormExample = () => {
  return (
    <Form>
      <Form.Item name="tenantId" label="Tenant ID" rules={tenantIdRules}>
        <Input />
      </Form.Item>
      
      <Form.Item name="email" label="Admin Email" rules={adminEmailRules}>
        <Input />
      </Form.Item>
      
      <Form.Item name="password" label="Password" rules={adminPasswordRules}>
        <Input.Password />
      </Form.Item>
    </Form>
  );
};

// Customer Form
const CustomerFormExample = () => {
  return (
    <Form>
      <Form.Item name="name" label="Full Name" rules={customerNameRules}>
        <Input />
      </Form.Item>
      
      <Form.Item name="email" label="Email" rules={customerEmailRules}>
        <Input />
      </Form.Item>
      
      <Form.Item name="phone" label="Phone" rules={customerPhoneRules}>
        <Input />
      </Form.Item>
      
      <Form.Item 
        name="emergency_contact" 
        label="Emergency Contact" 
        rules={emergencyPhoneRules}
      >
        <Input />
      </Form.Item>
      
      <Form.Item name="password" label="Password" rules={customerPasswordRules}>
        <Input.Password />
      </Form.Item>
    </Form>
  );
};

// ============================================================================
// EXAMPLE 2: Using Customized Rules
// ============================================================================

const CustomizedFormExample = () => {
  return (
    <Form>
      {/* Email - optional with custom messages */}
      <Form.Item
        name="email"
        label="Email (Optional)"
        rules={emailRules(
          false, // not required
          "Please enter email", // required message (won't show since not required)
          "Invalid email format" // invalid format message
        )}
      >
        <Input />
      </Form.Item>
      
      {/* Phone - 12 digits instead of 10 */}
      <Form.Item
        name="international_phone"
        label="International Phone"
        rules={phoneRules(
          true,
          "Please enter phone number",
          "Phone must be exactly 12 digits",
          12 // exact length
        )}
      >
        <Input />
      </Form.Item>
      
      {/* Password - min 8 characters */}
      <Form.Item
        name="password"
        label="Password"
        rules={passwordRules(
          true,
          8, // min length
          "Please enter password",
          "Password must be at least 8 characters"
        )}
      >
        <Input.Password />
      </Form.Item>
      
      {/* Name - with min/max length */}
      <Form.Item
        name="name"
        label="Full Name"
        rules={nameRules(
          true,
          "Please enter name",
          3, // min length
          50  // max length
        )}
      >
        <Input />
      </Form.Item>
    </Form>
  );
};

// ============================================================================
// EXAMPLE 3: Using Validation Functions (Programmatic Validation)
// ============================================================================

const ProgrammaticValidationExample = () => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  });
  
  const handleSubmit = () => {
    // Validate before submission
    const errors = {};
    
    if (!isValidEmail(formData.email)) {
      errors.email = "Invalid email format";
    }
    
    if (!isValidPhone(formData.phone, 10)) {
      errors.phone = "Phone must be 10 digits";
    }
    
    if (!isValidPassword(formData.password, 8)) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (Object.keys(errors).length > 0) {
      console.error("Validation errors:", errors);
      return;
    }
    
    // Proceed with submission
    console.log("Form is valid:", formData);
  };
  
  return (
    <div>
      <Input
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <Input
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
      <Input.Password
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
};

// ============================================================================
// EXAMPLE 4: Advanced Rules (Numbers, Dates, Custom Patterns)
// ============================================================================

const AdvancedFormExample = () => {
  return (
    <Form>
      {/* Positive number (amount, price) */}
      <Form.Item
        name="rent"
        label="Monthly Rent"
        rules={amountRules}
      >
        <Input type="number" />
      </Form.Item>
      
      {/* Non-negative number (balance, count) */}
      <Form.Item
        name="balance"
        label="Balance"
        rules={balanceRules}
      >
        <Input type="number" />
      </Form.Item>
      
      {/* Number with min/max */}
      <Form.Item
        name="age"
        label="Age"
        rules={numberRules(
          true,
          "Please enter age",
          "Please enter a valid number",
          false, // no decimals
          18,    // min
          100    // max
        )}
      >
        <Input type="number" />
      </Form.Item>
      
      {/* Date - must be in the past */}
      <Form.Item
        name="dob"
        label="Date of Birth"
        rules={dobRules}
      >
        <DatePicker />
      </Form.Item>
      
      {/* Date - must be in the future */}
      <Form.Item
        name="appointment_date"
        label="Appointment Date"
        rules={dateRules(
          true,
          "Please select appointment date",
          false, // not past
          true   // must be future
        )}
      >
        <DatePicker />
      </Form.Item>
      
      {/* UUID validation */}
      <Form.Item
        name="tenant_id"
        label="Tenant ID"
        rules={uuidRules(
          true,
          "Please enter Tenant ID",
          "Invalid Tenant ID format"
        )}
      >
        <Input />
      </Form.Item>
      
      {/* Custom pattern */}
      <Form.Item
        name="pincode"
        label="Pincode"
        rules={patternRules(
          /^[0-9]{6}$/,
          "Pincode must be 6 digits",
          true,
          "Please enter pincode"
        )}
      >
        <Input />
      </Form.Item>
      
      {/* Text with length constraints */}
      <Form.Item
        name="description"
        label="Description"
        rules={textLengthRules(
          false, // optional
          10,    // min length
          500    // max length
        )}
      >
        <Input.TextArea />
      </Form.Item>
    </Form>
  );
};

// ============================================================================
// EXAMPLE 5: Combining Multiple Rules
// ============================================================================

const CombinedRulesExample = () => {
  return (
    <Form>
      {/* Combine required rule with custom validator */}
      <Form.Item
        name="username"
        label="Username"
        rules={[
          ...requiredRule("Please enter username"),
          {
            validator: (_, value) => {
              if (value && value.length < 3) {
                return Promise.reject(new Error("Username must be at least 3 characters"));
              }
              if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
                return Promise.reject(new Error("Username can only contain letters, numbers, and underscores"));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input />
      </Form.Item>
    </Form>
  );
};

// ============================================================================
// EXAMPLE 6: Conditional Validation
// ============================================================================

const ConditionalValidationExample = () => {
  const [hasEmergencyContact, setHasEmergencyContact] = useState(false);
  
  return (
    <Form>
      <Checkbox
        checked={hasEmergencyContact}
        onChange={(e) => setHasEmergencyContact(e.target.checked)}
      >
        Has Emergency Contact
      </Checkbox>
      
      {hasEmergencyContact && (
        <Form.Item
          name="emergency_phone"
          label="Emergency Phone"
          rules={customerPhoneRules} // Required when shown
        >
          <Input />
        </Form.Item>
      )}
    </Form>
  );
};

// ============================================================================
// MIGRATION GUIDE: Replacing Inline Rules
// ============================================================================

// BEFORE (Inline rules):
const BeforeExample = () => {
  return (
    <Form.Item
      name="phone"
      label="Phone"
      rules={[
        { required: true, message: "Please enter phone number" },
        { pattern: /^[0-9]{10}$/, message: "Phone number must be 10 digits" },
      ]}
    >
      <Input />
    </Form.Item>
  );
};

// AFTER (Using centralized validators):
const AfterExample = () => {
  return (
    <Form.Item
      name="phone"
      label="Phone"
      rules={customerPhoneRules} // or phoneRules(true, "Please enter phone number", "Phone number must be 10 digits", 10)
    >
      <Input />
    </Form.Item>
  );
};

// BEFORE (Email):
const BeforeEmailExample = () => {
  return (
    <Form.Item
      name="email"
      label="Email"
      rules={[
        { required: true, message: "Please enter email" },
        { type: "email", message: "Enter a valid email address" },
      ]}
    >
      <Input />
    </Form.Item>
  );
};

// AFTER (Using centralized validators):
const AfterEmailExample = () => {
  return (
    <Form.Item
      name="email"
      label="Email"
      rules={customerEmailRules} // or emailRules(true, "Please enter email", "Enter a valid email address")
    >
      <Input />
    </Form.Item>
  );
};

