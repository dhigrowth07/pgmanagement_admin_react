import React, { useState, useEffect } from "react";
import { Form, Input, Button, DatePicker, Select, Upload, Alert, Typography, Row, Col, message, Checkbox, InputNumber } from "antd";
import { UploadOutlined, CheckCircleOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { generateCustomerPDF } from "../../utils/pdfGenerator";
import { getTermsAndConditions } from "../../services/tenantAdminsService";
import { resizeSignatureImage, imageToDataURL } from "../../utils/imageResizer";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const UserOnboardPage2 = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  /** @type {[string | null, Function]} */
  const [error, setError] = useState(null);
  /** @type {[boolean, Function]} */
  const [isSuccess, setIsSuccess] = useState(false);
  /** @type {[Array<any>, Function]} */
  const [idProofFileList, setIdProofFileList] = useState([]);
  /** @type {[Array<any>, Function]} */
  const [availableRooms, setAvailableRooms] = useState([]);
  /** @type {[Array<any>, Function]} */
  const [signatureFileList, setSignatureFileList] = useState([]);
  /** @type {[string | null, Function]} */
  const [termsAndConditions, setTermsAndConditions] = useState(null);
  /** @type {[string, Function]} */
  const [tenantName, setTenantName] = useState("PG Management"); // Default tenant name for PDF
  /** @type {[Array<any>, Function]} */
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    // Read tenant_id and admin_id from URL query parameters
    const tenantIdFromUrl = searchParams.get("tenant_id");
    const adminIdFromUrl = searchParams.get("admin_id");

    // Use tenant_id from URL if available, otherwise fallback to hardcoded value (for backward compatibility)
    const tenantId = tenantIdFromUrl || "6a4dc5af-ee9a-4128-a78f-dcb4b0c32330";
    localStorage.setItem("tenant_id", tenantId);

    // Store admin_id if provided in URL
    if (adminIdFromUrl) {
      localStorage.setItem("admin_id", adminIdFromUrl);
    }

    const fetchRooms = async () => {
      try {
        // Public rooms endpoint (no auth required, only tenant_id header)
        // Pass admin_id as query parameter if available to filter rooms by admin
        const adminIdFromUrl = searchParams.get("admin_id");
        const queryParams = adminIdFromUrl ? { admin_id: adminIdFromUrl } : {};
        const res = await api.get("/api/v1/rooms/public", { params: queryParams });
        const allRooms = res.data?.data || [];
        const vacantRooms = allRooms.filter((room) => room.current_occupancy < room.capacity);
        setAvailableRooms(vacantRooms);
      } catch (e) {
        console.error("Failed to load rooms for onboarding:", e);
      }
    };

    const fetchTermsAndConditions = async () => {
      try {
        const response = await getTermsAndConditions();
        if (response?.data?.data) {
          // Extract terms and conditions
          if (response.data.data.terms_and_conditions) {
            setTermsAndConditions(response.data.data.terms_and_conditions);
          }
          // Extract tenant name from response
          if (response.data.data.tenant_name) {
            setTenantName(response.data.data.tenant_name);
            console.log("[UserOnboard] Tenant name retrieved:", response.data.data.tenant_name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch terms and conditions:", err);
        // Don't show error to user, just log it - PDF will be generated without terms if fetch fails
      }
    };

    const fetchCustomFields = async () => {
      try {
        const tenantIdFromUrl = searchParams.get("tenant_id");
        const tenantId = tenantIdFromUrl || "6a4dc5af-ee9a-4128-a78f-dcb4b0c32330";

        // Use public endpoint (no auth required)
        const response = await api.get(`/api/v1/custom-fields/public?tenant_id=${tenantId}`);
        if (response?.data?.data) {
          // Sort by display_order, then by field_name
          const sortedFields = [...response.data.data].sort((a, b) => {
            if (a.display_order !== b.display_order) {
              return a.display_order - b.display_order;
            }
            return a.field_name.localeCompare(b.field_name);
          });
          setCustomFields(sortedFields);
          console.log("[UserOnboard] Custom fields loaded:", sortedFields.length);
        }
      } catch (err) {
        console.error("Failed to fetch custom fields:", err);
        // Don't show error to user, just log it - form will work without custom fields
        setCustomFields([]);
      }
    };

    fetchRooms();
    fetchTermsAndConditions();
    fetchCustomFields();
  }, [searchParams]);

  const handleFinish = async (values) => {
    setError(null);

    // Ensure tenant_id is set (from URL params or fallback)
    const tenantIdFromUrl = searchParams.get("tenant_id");
    const tenantId = tenantIdFromUrl || "6a4dc5af-ee9a-4128-a78f-dcb4b0c32330";
    localStorage.setItem("tenant_id", tenantId);

    // Ensure admin_id is set if provided in URL
    const adminIdFromUrl = searchParams.get("admin_id");
    if (adminIdFromUrl) {
      localStorage.setItem("admin_id", adminIdFromUrl);
    }

    const formData = new FormData();

    // Required/basic fields
    formData.append("name", values.name?.trim() ?? "");
    formData.append("email", values.email?.trim() ?? "");
    formData.append("password", values.password?.trim() ?? "");
    formData.append("phone", values.phone?.trim() ?? "");

    // Optional / additional fields
    if (values.gender) {
      formData.append("gender", values.gender.toLowerCase());
    }

    if (values.dob) {
      formData.append("dob", values.dob.format("YYYY-MM-DD"));
    }

    if (values.emergency_number_one) {
      formData.append("emergency_number_one", values.emergency_number_one.trim());
    }
    if (values.emergency_number_two) {
      formData.append("emergency_number_two", values.emergency_number_two.trim());
    }

    if (values.room_number) {
      formData.append("room_number", values.room_number.trim());
    }

    if (values.advance_amount !== undefined && values.advance_amount !== null && values.advance_amount !== "") {
      formData.append("advance_amount", values.advance_amount);
    }

    // Handle custom fields
    const customFieldsData = {};
    customFields.forEach((field) => {
      const fieldValue = values[`custom_field_${field.field_name}`];
      // Only include if value is provided (not null/undefined/empty string)
      if (fieldValue !== null && fieldValue !== undefined && fieldValue !== "") {
        // Handle different field types
        if (field.field_type === "date" && dayjs.isDayjs(fieldValue)) {
          customFieldsData[field.field_name] = fieldValue.format("YYYY-MM-DD");
        } else if (field.field_type === "checkbox" && Array.isArray(fieldValue)) {
          customFieldsData[field.field_name] = fieldValue;
        } else if (field.field_type === "checkbox" && typeof fieldValue === "boolean") {
          customFieldsData[field.field_name] = fieldValue;
        } else {
          customFieldsData[field.field_name] = fieldValue;
        }
      }
    });

    // Append custom fields as JSON string
    if (Object.keys(customFieldsData).length > 0) {
      formData.append("custom_fields", JSON.stringify(customFieldsData));
    }

    // Profile image (single file)
    if (values.profile_image && values.profile_image.length > 0) {
      const fileObj = values.profile_image[0].originFileObj || values.profile_image[0];
      if (fileObj) {
        formData.append("profile_image", fileObj);
      }
    }

    // ID proofs (at least one required)
    idProofFileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append("id_proofs", file.originFileObj);
      }
    });

    // Validate that at least one ID proof is uploaded
    if (idProofFileList.length === 0) {
      setError("Please upload at least one ID proof document.");
      return;
    }

    // Process signature image if uploaded (resize and convert to base64 for PDF)
    let signatureDataURL = null;
    if (signatureFileList.length > 0 && signatureFileList[0].originFileObj) {
      try {
        const signatureFile = signatureFileList[0].originFileObj;
        // Resize signature to appropriate size (max 200x80 for signature)
        const resizedSignature = await resizeSignatureImage(signatureFile, 200, 80, 0.9);
        // Convert to base64 data URL for PDF
        signatureDataURL = await imageToDataURL(resizedSignature);
      } catch (signatureError) {
        console.error("Error processing signature image:", signatureError);
        message.warning("Failed to process signature image. PDF will be generated without signature.");
      }
    }

    // Prepare customer data object for PDF generation
    const customerDataForPDF = {
      name: values.name?.trim() || "",
      email: values.email?.trim() || "",
      phone: values.phone?.trim() || "",
      gender: values.gender?.toLowerCase() || "",
      dob: values.dob || null, // Keep as dayjs object for PDF generator
      emergency_number_one: values.emergency_number_one?.trim() || "",
      emergency_number_two: values.emergency_number_two?.trim() || "",
      room_number: values.room_number?.trim() || "",
      advance_amount: values.advance_amount !== undefined && values.advance_amount !== null && values.advance_amount !== "" ? values.advance_amount : 0,
      id_proofs: idProofFileList,
      profile_image: values.profile_image && values.profile_image.length > 0,
    };

    // Generate PDF and add it to FormData as an ID proof (without downloading)
    let pdfResult = null;
    try {
      console.log("[PDF] Starting PDF generation...");
      pdfResult = generateCustomerPDF(customerDataForPDF, {
        tenantName: tenantName,
        autoDownload: false, // Don't download yet, wait for successful response
        termsAndConditions: termsAndConditions || undefined, // Pass terms and conditions to PDF generator
        signature: signatureDataURL || undefined, // Pass signature image data URL
      });

      console.log("[PDF] PDF generation result:", pdfResult ? "Success" : "Failed", pdfResult);

      // Add the generated PDF file to FormData as an ID proof
      if (pdfResult && pdfResult.file) {
        formData.append("id_proofs", pdfResult.file);
        console.log("[PDF] PDF added to FormData as ID proof:", pdfResult.fileName, "File size:", pdfResult.file.size, "bytes");
      } else {
        console.warn("[PDF] PDF generation returned null or file is missing. pdfResult:", pdfResult);
      }
    } catch (pdfError) {
      console.error("[PDF] Error generating PDF for upload:", pdfError);
      console.error("[PDF] Error stack:", pdfError.stack);
      // Continue with submission even if PDF generation fails
    }

    setSubmitting(true);
    try {
      const response = await api.post("/api/v1/users/signup-onboard", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(response.data?.msg || "Onboarding request submitted successfully. You will be activated by the admin.");

      // Download PDF only after successful submission
      if (pdfResult && pdfResult.doc && pdfResult.fileName) {
        try {
          console.log("[PDF Download] Attempting to download PDF:", pdfResult.fileName);
          pdfResult.doc.save(pdfResult.fileName);
          console.log("[PDF Download] PDF downloaded successfully");
          toast.success("PDF generated and downloaded successfully!");
        } catch (pdfError) {
          console.error("[PDF Download] Error downloading PDF:", pdfError);
          // Check if PDF was uploaded to S3 and can be downloaded from there
          if (response.data?.data?.user?.id_proof_urls) {
            const pdfUrl = response.data.data.user.id_proof_urls.find((url) => url.endsWith(".pdf"));
            if (pdfUrl) {
              console.log("[PDF Download] PDF found in S3, downloading from:", pdfUrl);
              const link = document.createElement("a");
              link.href = pdfUrl;
              link.download = `Customer_Registration_${response.data.data.user.name || "Customer"}_${Date.now()}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success("PDF downloaded from server!");
            }
          }
        }
      }

      // Set success state to show success message instead of form
      setIsSuccess(true);

      // Clear form data (but don't reset form fields since we're showing success)
      form.resetFields();
      setIdProofFileList([]);
      setSignatureFileList([]);
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to submit onboarding form. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Success view
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-3 py-6 md:py-10">
        <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
          <div className="text-center">
            <div style={{ marginBottom: 24 }}>
              <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a", marginBottom: 16 }} />
            </div>
            <Title level={3} style={{ marginBottom: 16, color: "#52c41a" }}>
              Onboarding Request Submitted Successfully!
            </Title>
            <Paragraph style={{ fontSize: 16, marginBottom: 24, color: "#595959" }}>
              Thank you for submitting your onboarding request. Your account details have been received and are pending admin approval.
            </Paragraph>
            <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 20, marginBottom: 24, textAlign: "left" }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                What happens next?
              </Title>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#595959" }}>
                <li style={{ marginBottom: 8 }}>Your request will be reviewed by the admin</li>

                <li style={{ marginBottom: 8 }}>You can then log in with your credentials</li>
                <li>If you have any questions, please contact the PG administration</li>
              </ul>
            </div>
            <Alert
              message="Important"
              description="Please keep your login credentials safe. You will need them to access your account once it's activated."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Button
              type="primary"
              size="large"
              onClick={() => {
                setIsSuccess(false);
                setError(null);
                form.resetFields();
                setIdProofFileList([]);
                setSignatureFileList([]);
              }}
              style={{ width: "100%" }}
            >
              Submit Another Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-3 py-6 md:py-10">
      <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
        <div className="mb-6 md:mb-8 text-center">
          <Title level={3} style={{ marginBottom: 8 }}>
            Resident Onboarding
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 14 }}>
            Fill in your details to request onboarding to the PG. Your account will be reviewed and activated by the admin.
          </Paragraph>
        </div>

        {error && <Alert message="Submission error" description={error} type="error" showIcon closable className="mb-4" />}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark="optional"
          initialValues={{
            dob: null,
          }}
        >
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Please enter your name" }]}>
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please create a password" },
              {
                min: 6,
                message: "Password must be at least 6 characters",
              },
            ]}
          >
            <Input.Password placeholder="Minimum 6 characters" />
          </Form.Item>

          <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: "Please enter your phone number" }]}>
            <Input placeholder="Mobile number" />
          </Form.Item>

          <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: "Please select your date of birth" }]}>
            <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} disabledDate={(current) => current && current >= dayjs().startOf("day")} />
          </Form.Item>

          <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender" }]}>
            <Select placeholder="Select">
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="emergency_number_one" label="Emergency Contact 1">
            <Input placeholder="Primary emergency contact number" />
          </Form.Item>

          <Form.Item name="emergency_number_two" label="Emergency Contact 2">
            <Input placeholder="Secondary emergency contact number" />
          </Form.Item>

          <Form.Item name="room_number" label="Preferred Room" rules={[{ required: true, message: "Please select a room" }]}>
            <Select
              placeholder={availableRooms.length === 0 ? "No rooms available" : "Select a room"}
              disabled={availableRooms.length === 0}
              showSearch
              optionFilterProp="label"
              options={availableRooms.map((room) => ({
                label: `${room.block_name || "Block"} - ${room.room_number} (${room.current_occupancy}/${room.capacity})`,
                value: room.room_number,
              }))}
            />
          </Form.Item>

          <Form.Item name="advance_amount" label="Advance Amount (optional)" tooltip="If you are paying some advance during onboarding.">
            <Input type="number" min={0} step="0.01" placeholder="0.00" />
          </Form.Item>

          <Form.Item
            name="profile_image"
            label="Profile Image (optional)"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e;
              return e && e.fileList ? e.fileList.slice(-1) : [];
            }}
          >
            <Upload beforeUpload={() => false} maxCount={1} accept="image/*" listType="picture">
              <Button icon={<UploadOutlined />}>Upload Profile Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="ID Proof Documents"
            required
            validateStatus={idProofFileList.length === 0 ? "error" : undefined}
            help={idProofFileList.length === 0 ? "Please upload at least one ID proof document" : "At least one ID proof document is required"}
          >
            <Upload
              multiple
              fileList={idProofFileList}
              beforeUpload={(file) => {
                // Validate file type (JPEG, PNG, WebP, PDF only)
                const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
                const isValidType = allowedTypes.includes(file.type);
                if (!isValidType) {
                  message.error(`${file.name} is not a valid file type. Please upload only JPEG, PNG, WebP, or PDF files.`);
                  return false;
                }
                const fileWithMeta = {
                  uid: file.uid || `${file.name}-${Date.now()}`,
                  name: file.name,
                  status: "done",
                  originFileObj: file,
                };
                setIdProofFileList((prev) => [...prev, fileWithMeta]);
                return false;
              }}
              onRemove={(file) => {
                setIdProofFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
              accept="image/jpeg,image/jpg,image/png,image/webp,.pdf,application/pdf"
              listType="text"
            >
              <Button icon={<UploadOutlined />}>Upload ID Proofs</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Supported formats: images or PDFs. At least one document is required (e.g. Aadhar, PAN, Passport, etc.).
            </Text>
          </Form.Item>

          <Form.Item name="signature" label="Signature (Optional)" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList ? e.fileList : [])}>
            <div>
              <Upload
                fileList={signatureFileList}
                beforeUpload={(file) => {
                  // Validate file type (images only, no PDF)
                  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                  if (!allowedTypes.includes(file.type)) {
                    message.error("Signature must be an image file (JPEG, PNG, or WebP)");
                    setSignatureFileList([]);
                    return false;
                  }
                  // Validate file size (max 5MB)
                  const maxSize = 5 * 1024 * 1024; // 5MB
                  if (file.size > maxSize) {
                    message.error("Signature image must be smaller than 5MB");
                    setSignatureFileList([]);
                    return false;
                  }
                  const fileWithMeta = {
                    uid: file.uid || `${file.name}-${Date.now()}`,
                    name: file.name,
                    status: "done",
                    originFileObj: file,
                  };
                  setSignatureFileList([fileWithMeta]);
                  return false;
                }}
                onRemove={() => {
                  setSignatureFileList([]);
                }}
                maxCount={1}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                listType="picture-card"
              >
                {signatureFileList.length < 1 && <div>+ Upload Signature</div>}
              </Upload>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                Max 5MB. Supported: JPEG, PNG, WebP. Image will be automatically resized for PDF.
              </Text>
            </div>
          </Form.Item>

          {/* Custom Fields Section */}
          {customFields.length > 0 && (
            <>
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <Title level={5} style={{ marginBottom: 8 }}>
                  Additional Information
                </Title>
                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
                  Please provide the following additional details
                </Paragraph>
              </div>

              {customFields.map((field) => {
                const fieldName = `custom_field_${field.field_name}`;
                const rules = [];

                // Add required validation
                if (field.is_required) {
                  rules.push({
                    required: true,
                    message: `${field.field_label} is required`,
                  });
                }

                // Add type-specific validation
                if (field.validation_rules) {
                  const validationRules = field.validation_rules;

                  // Text/Textarea validations
                  if (field.field_type === "text" || field.field_type === "textarea") {
                    if (validationRules.minLength) {
                      rules.push({
                        validator: (_, value) => {
                          if (value === null || value === undefined || value === "") {
                            return Promise.resolve();
                          }
                          if (String(value).length < validationRules.minLength) {
                            return Promise.reject(new Error(`${field.field_label} must be at least ${validationRules.minLength} characters`));
                          }
                          return Promise.resolve();
                        },
                      });
                    }
                    if (validationRules.maxLength) {
                      rules.push({
                        validator: (_, value) => {
                          if (value === null || value === undefined || value === "") {
                            return Promise.resolve();
                          }
                          if (String(value).length > validationRules.maxLength) {
                            return Promise.reject(new Error(`${field.field_label} cannot exceed ${validationRules.maxLength} characters`));
                          }
                          return Promise.resolve();
                        },
                      });
                    }
                    if (validationRules.pattern) {
                      rules.push({
                        pattern: new RegExp(validationRules.pattern),
                        message: validationRules.patternError || `${field.field_label} format is invalid`,
                      });
                    }
                  }

                  // Number validations
                  if (field.field_type === "number") {
                    if (validationRules.min !== undefined) {
                      rules.push({
                        validator: (_, value) => {
                          if (value === null || value === undefined || value === "") {
                            return Promise.resolve();
                          }
                          const numValue = Number(value);
                          if (isNaN(numValue) || numValue < validationRules.min) {
                            return Promise.reject(new Error(`${field.field_label} must be at least ${validationRules.min}`));
                          }
                          return Promise.resolve();
                        },
                      });
                    }
                    if (validationRules.max !== undefined) {
                      rules.push({
                        validator: (_, value) => {
                          if (value === null || value === undefined || value === "") {
                            return Promise.resolve();
                          }
                          const numValue = Number(value);
                          if (isNaN(numValue) || numValue > validationRules.max) {
                            return Promise.reject(new Error(`${field.field_label} cannot exceed ${validationRules.max}`));
                          }
                          return Promise.resolve();
                        },
                      });
                    }
                  }
                }

                // Render field based on type
                let fieldComponent = null;

                switch (field.field_type) {
                  case "text":
                    fieldComponent = <Input placeholder={`Enter ${field.field_label.toLowerCase()}`} />;
                    break;

                  case "textarea":
                    fieldComponent = <TextArea rows={3} placeholder={`Enter ${field.field_label.toLowerCase()}`} />;
                    break;

                  case "number":
                    fieldComponent = (
                      <InputNumber style={{ width: "100%" }} placeholder={`Enter ${field.field_label.toLowerCase()}`} min={field.validation_rules?.min} max={field.validation_rules?.max} />
                    );
                    break;

                  case "email":
                    rules.push({
                      validator: (_, value) => {
                        if (value === null || value === undefined || value === "") {
                          return Promise.resolve();
                        }
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(String(value))) {
                          return Promise.reject(new Error("Please enter a valid email address"));
                        }
                        return Promise.resolve();
                      },
                    });
                    fieldComponent = <Input type="email" placeholder={`Enter ${field.field_label.toLowerCase()}`} />;
                    break;

                  case "phone":
                    fieldComponent = <Input type="tel" placeholder={`Enter ${field.field_label.toLowerCase()}`} />;
                    break;

                  case "date":
                    fieldComponent = (
                      <DatePicker
                        format="DD-MM-YYYY"
                        style={{ width: "100%" }}
                        disabledDate={(current) => current && current >= dayjs().startOf("day")}
                        placeholder={`Select ${field.field_label.toLowerCase()}`}
                      />
                    );
                    break;

                  case "select":
                    fieldComponent = (
                      <Select placeholder={`Select ${field.field_label.toLowerCase()}`} showSearch optionFilterProp="label">
                        {field.options?.map((option) => (
                          <Option key={option.value} value={option.value} label={option.label}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    );
                    break;

                  case "checkbox":
                    // For checkbox with options, render as multiple checkboxes
                    if (field.options && field.options.length > 0) {
                      fieldComponent = (
                        <Checkbox.Group>
                          {field.options.map((option) => (
                            <Checkbox key={option.value} value={option.value}>
                              {option.label}
                            </Checkbox>
                          ))}
                        </Checkbox.Group>
                      );
                    } else {
                      // Single checkbox (boolean)
                      fieldComponent = <Checkbox>{field.field_label}</Checkbox>;
                    }
                    break;

                  default:
                    fieldComponent = <Input placeholder={`Enter ${field.field_label.toLowerCase()}`} />;
                }

                return (
                  <Form.Item
                    key={field.field_id}
                    name={fieldName}
                    label={field.field_label}
                    rules={rules}
                    valuePropName={field.field_type === "checkbox" && !field.options ? "checked" : "value"}
                    getValueFromEvent={
                      field.field_type === "checkbox" && field.options
                        ? undefined
                        : field.field_type === "number"
                        ? (value) => (value === null || value === undefined ? undefined : Number(value))
                        : undefined
                    }
                  >
                    {fieldComponent}
                  </Form.Item>
                );
              })}
            </>
          )}

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Onboarding Request"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default UserOnboardPage2;
