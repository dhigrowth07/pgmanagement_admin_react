import React, { useEffect, useState, useMemo } from "react";
import { Modal, Form, Input, Button, Alert, Row, Col, DatePicker, Select, Upload, Avatar, Typography, message, Checkbox, InputNumber } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { customerNameRules, customerEmailRules, customerPhoneRules, customerPasswordRules, emergencyPhoneRules, dobRules, genderRules } from "../../../../utils/validators";
import { selectAllRooms, selectAllBlocks, fetchRoomsData } from "../../../../redux/room/roomSlice";
import { useSelector, useDispatch } from "react-redux";
import { generateCustomerPDF } from "../../../../utils/pdfGenerator";
import { selectUser } from "../../../../redux/auth/authSlice";
import { getTermsAndConditions } from "../../../../services/tenantAdminsService";
import { resizeSignatureImage, imageToDataURL } from "../../../../utils/imageResizer";
import api from "../../../../services/api";

const { Option } = Select;
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const SignupOnboardModal = ({ visible, onCancel, onSubmit, loading, error }) => {
  const [form] = Form.useForm();
  const [profileImageFileList, setProfileImageFileList] = useState([]);
  const [idProofFileList, setIdProofFileList] = useState([]);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [signatureFileList, setSignatureFileList] = useState([]);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [termsAndConditions, setTermsAndConditions] = useState(null);
  const [loadingTerms, setLoadingTerms] = useState(false);
  /** @type {[Array<any>, Function]} */
  const [customFields, setCustomFields] = useState([]);
  const rooms = useSelector(selectAllRooms);
  const blocks = useSelector(selectAllBlocks);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  // Fetch terms and conditions and rooms when modal opens
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setProfileImageFileList([]);
      setIdProofFileList([]);
      setProfileImagePreview(null);
      setSignatureFileList([]);
      setSignaturePreview(null);
      setTermsAndConditions(null);

      // Fetch rooms data
      dispatch(fetchRoomsData());

      // Fetch terms and conditions
      const fetchTermsAndConditions = async () => {
        setLoadingTerms(true);
        try {
          const response = await getTermsAndConditions();
          if (response.data?.status === 200 && response.data?.data?.terms_and_conditions) {
            setTermsAndConditions(response.data.data.terms_and_conditions);
          }
        } catch (error) {
          console.error("Error fetching terms and conditions:", error);
          // Don't show error to user, just log it - PDF will be generated without terms if fetch fails
        } finally {
          setLoadingTerms(false);
        }
      };

      fetchTermsAndConditions();

      // Fetch custom fields
      const fetchCustomFields = async () => {
        try {
          const tenantId = user?.tenant_id || localStorage.getItem("tenant_id");
          if (!tenantId) {
            console.warn("No tenant_id found, cannot fetch custom fields");
            setCustomFields([]);
            return;
          }

          // Use public endpoint (no auth required, but we have auth in this context)
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
            console.log("[SignupOnboardModal] Custom fields loaded:", sortedFields.length);
          }
        } catch (err) {
          console.error("Failed to fetch custom fields:", err);
          // Don't show error to user, just log it - form will work without custom fields
          setCustomFields([]);
        }
      };

      fetchCustomFields();
    }
  }, [visible, form, dispatch, user]);

  const handleFinish = async (values) => {
    // Validate ID proofs before submission
    if (idProofFileList.length === 0) {
      form.setFields([
        {
          name: "id_proofs",
          errors: ["Please upload at least one ID proof document"],
        },
      ]);
      return;
    }

    const formData = new FormData();

    // Required fields
    formData.append("name", values.name?.trim() || "");
    formData.append("email", values.email?.trim() || "");
    formData.append("password", values.password || "");
    formData.append("phone", values.phone?.trim() || "");
    formData.append("gender", values.gender?.toLowerCase() || "");
    formData.append("dob", values.dob ? values.dob.format("YYYY-MM-DD") : "");

    // Required: Emergency Contact 1
    formData.append("emergency_number_one", values.emergency_number_one?.trim() || "");

    // Optional: Emergency Contact 2
    if (values.emergency_number_two) {
      formData.append("emergency_number_two", values.emergency_number_two.trim());
    }

    // Required: Room Number
    formData.append("room_number", values.room_number?.trim() || "");

    // Optional: Advance Amount
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

    // Profile image (single file, optional)
    if (profileImageFileList.length > 0) {
      const profileFile = profileImageFileList[0];
      if (profileFile.originFileObj) {
        formData.append("profile_image", profileFile.originFileObj);
      }
    }

    // ID proofs (multiple files, required - at least 1)
    idProofFileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append("id_proofs", file.originFileObj);
      }
    });

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
      profile_image: profileImageFileList.length > 0,
    };

    // Generate PDF and add it to FormData as an ID proof (without downloading)
    let pdfResult = null;
    try {
      console.log("[PDF] Starting PDF generation...");
      pdfResult = generateCustomerPDF(customerDataForPDF, {
        tenantName: user?.tenant_name || "PG Management",
        autoDownload: false, // Don't download yet, wait for successful response
        termsAndConditions: termsAndConditions, // Pass terms and conditions to PDF generator
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

    // Pass formData, customerData, and pdfResult to onSubmit
    onSubmit(formData, customerDataForPDF, pdfResult);
  };

  const handleProfileImageChange = (info) => {
    const fileList = Array.isArray(info) ? info : info.fileList;
    setProfileImageFileList(fileList);

    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.originFileObj) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && e.target.result) {
            setProfileImagePreview(e.target.result);
          }
        };
        reader.readAsDataURL(file.originFileObj);
      } else if (file.url) {
        setProfileImagePreview(file.url);
      }
    } else {
      setProfileImagePreview(null);
    }
  };

  const validateFileType = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const isValidType = allowedTypes.includes(file.type);
    if (!isValidType) {
      message.error(`${file.name} is not a valid file type. Please upload only JPEG, PNG, WebP, or PDF files.`);
      return false;
    }
    return true;
  };

  const handleIdProofChange = (info) => {
    const fileList = Array.isArray(info) ? info : info.fileList;
    setIdProofFileList(fileList);
    // Trigger validation when files change
    form.validateFields(["id_proofs"]).catch(() => {
      // Ignore validation errors, just trigger the validation
    });
  };

  const handleSignatureChange = async (info) => {
    const fileList = Array.isArray(info) ? info : info.fileList;

    // Validate signature file
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.originFileObj) {
        // Validate file type (images only, no PDF)
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.originFileObj.type)) {
          message.error("Signature must be an image file (JPEG, PNG, or WebP)");
          setSignatureFileList([]);
          setSignaturePreview(null);
          return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.originFileObj.size > maxSize) {
          message.error("Signature image must be less than 5MB");
          setSignatureFileList([]);
          setSignaturePreview(null);
          return;
        }

        // Resize and preview signature
        try {
          const resizedSignature = await resizeSignatureImage(file.originFileObj, 200, 80, 0.9);
          const previewURL = await imageToDataURL(resizedSignature);
          setSignaturePreview(previewURL);
          setSignatureFileList([{ ...file, originFileObj: resizedSignature }]);
        } catch (error) {
          console.error("Error processing signature:", error);
          message.error("Failed to process signature image");
          setSignatureFileList([]);
          setSignaturePreview(null);
        }
      } else if (file.url) {
        setSignaturePreview(file.url);
        setSignatureFileList(fileList);
      }
    } else {
      setSignaturePreview(null);
      setSignatureFileList([]);
    }
  };

  // Group rooms by blocks (only show rooms that belong to existing blocks)
  const groupedRooms = useMemo(() => {
    if (!blocks || !rooms) return [];

    // Get all block IDs that exist
    const existingBlockIds = new Set((blocks || []).map((block) => block.block_id));

    // Group rooms by existing blocks
    const groupedByBlocks = (blocks || [])
      .map((block) => {
        const blockRooms = (rooms || []).filter((room) => {
          if (room.block_id !== block.block_id) return false;
          // Only show rooms with available beds
          return room.current_occupancy < room.capacity;
        });

        return {
          label: block.block_name || "Unassigned",
          options: blockRooms.map((room) => {
            const blockName = room.block_name || block.block_name || "";
            const availableBeds = (room.capacity || 0) - (room.current_occupancy || 0);
            const label = blockName
              ? `${blockName} - Room ${room.room_number} (${availableBeds} bed${availableBeds !== 1 ? "s" : ""} available)`
              : `Room ${room.room_number} (${availableBeds} bed${availableBeds !== 1 ? "s" : ""} available)`;

            return {
              label,
              value: room.room_number, // Using room_number as value (for backend API compatibility)
            };
          }),
        };
      })
      .filter((group) => group.options.length > 0);

    // Also include rooms with no block_id (null or undefined)
    const unassignedRooms = (rooms || []).filter((room) => {
      // Only show rooms with available beds
      if (room.current_occupancy >= room.capacity) return false;
      // Room has no block_id
      return !room.block_id;
    });

    const result = [...groupedByBlocks];
    if (unassignedRooms.length > 0) {
      const unassignedGroup = {
        label: "Unassigned",
        options: unassignedRooms.map((room) => {
          const availableBeds = (room.capacity || 0) - (room.current_occupancy || 0);
          return {
            label: `Room ${room.room_number} (${availableBeds} bed${availableBeds !== 1 ? "s" : ""} available)`,
            value: room.room_number,
          };
        }),
      };
      result.push(unassignedGroup);
    }

    return result;
  }, [blocks, rooms]);

  return (
    <Modal centered title="Add New Customer (Signup & Onboard)" open={visible} onCancel={onCancel} footer={null} maskClosable={false} width={700}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {error && <Alert message={error} type="error" showIcon closable className="mb-4" />}

        {/* Profile Image Upload */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 10, marginTop: 10 }}>
          <Form.Item
            style={{ width: "100%", maxWidth: 340, margin: "0 auto", textAlign: "center" }}
            name="profile_image"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <Upload
                style={{ textAlign: "center" }}
                listType="picture-card"
                fileList={profileImageFileList}
                beforeUpload={() => false}
                onChange={handleProfileImageChange}
                onRemove={() => {
                  setProfileImageFileList([]);
                  setProfileImagePreview(null);
                }}
                accept="image/*"
                maxCount={1}
                showUploadList={{ showPreviewIcon: false }}
              >
                {profileImageFileList.length < 1 && <div>Upload</div>}
              </Upload>
              <label style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center" }}>Profile Image (Optional)</label>
              <Text type="secondary" style={{ fontSize: 12, textAlign: "center", display: "block" }}>
                Max 5MB. Supported: JPEG, PNG, WebP
              </Text>
            </div>
          </Form.Item>
        </div>

        {/* 
        <Form.Item name="profile_image" label="Profile Image (Optional)" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}>
          <Upload
            listType="picture-card"
            fileList={profileImageFileList}
            beforeUpload={() => false}
            onChange={handleProfileImageChange}
            onRemove={() => {
              setProfileImageFileList([]);
              setProfileImagePreview(null);
            }}
            accept="image/*"
            maxCount={1}
          >
            {profileImageFileList.length < 1 && <div>Upload</div>}
          </Upload>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Max 5MB. Supported: JPEG, PNG, WebP
          </Text>
        </Form.Item> */}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="Full Name" rules={customerNameRules}>
              <Input placeholder="John Doe" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email" rules={customerEmailRules}>
              <Input placeholder="user@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone" label="Phone Number" rules={customerPhoneRules}>
              <Input placeholder="9876543210" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="password" label="Password" rules={customerPasswordRules}>
              <Input.Password placeholder="Minimum 6 characters" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="gender" label="Gender" rules={genderRules}>
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dob"
              label="Date of Birth"
              rules={[
                ...dobRules,
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.resolve(); // Required validation is handled by dobRules
                    }
                    const dobDate = dayjs(value);
                    const today = dayjs();
                    const age = today.diff(dobDate, "year");
                    if (age < 16) {
                      return Promise.reject(new Error("User must be at least 16 years old"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                format="DD-MM-YYYY"
                style={{ width: "100%" }}
                defaultPickerValue={dayjs().subtract(16, "year")}
                disabledDate={(current) => {
                  if (!current) return false;
                  const today = dayjs().startOf("day");
                  const sixteenYearsAgo = today.subtract(16, "year").startOf("day");
                  // Disable future dates (>= today)
                  if (current.isAfter(today) || current.isSame(today)) {
                    return true;
                  }
                  // Disable dates that are less than 16 years old (more recent than 16 years ago)
                  // Only allow dates that are at least 16 years old (on or before sixteenYearsAgo)
                  if (current.isAfter(sixteenYearsAgo)) {
                    return true;
                  }
                  return false;
                }}
                placeholder="Select date of birth"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="emergency_number_one" label="Emergency Contact 1" rules={[{ required: true, message: "Please enter emergency contact 1" }, ...emergencyPhoneRules]}>
              <Input placeholder="9876543210" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="emergency_number_two" label="Emergency Contact 2 (Optional)" rules={emergencyPhoneRules}>
              <Input placeholder="9876543210" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="room_number" label="Room Number" rules={[{ required: true, message: "Please select a room" }]}>
              <Select placeholder="Select room" showSearch optionFilterProp="label" options={groupedRooms} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="advance_amount"
              label="Advance Amount (Optional)"
              rules={[
                {
                  validator: (_, value) => {
                    // If no value provided, it's optional - allow it
                    if (!value || value === "" || value === null || value === undefined) {
                      return Promise.resolve();
                    }
                    // If value is provided, validate it's a non-negative number
                    const num = parseFloat(value);
                    if (isNaN(num)) {
                      return Promise.reject(new Error("Please enter a valid number"));
                    }
                    if (num < 0) {
                      return Promise.reject(new Error("Amount must be a non-negative number"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input type="number" placeholder="0.00" min={0} step="0.01" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="id_proofs"
          label="ID Proof Documents"
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          rules={[
            {
              validator: () => {
                if (idProofFileList.length === 0) {
                  return Promise.reject(new Error("Please upload at least one ID proof document"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Upload
            multiple
            fileList={idProofFileList}
            beforeUpload={(file) => {
              if (!validateFileType(file)) {
                return Upload.LIST_IGNORE; // Prevent file from being added to the list
              }
              return false; // Prevent auto upload
            }}
            onChange={handleIdProofChange}
            accept="image/jpeg,image/jpg,image/png,image/webp,.pdf,application/pdf"
            listType="text"
          >
            <Button icon={<UploadOutlined />}>Upload ID Proofs</Button>
          </Upload>
          <Text type="secondary" style={{ fontSize: 12 }}>
            At least 1 file required. Max 5 files, 10MB each. Supported: JPEG, PNG, WebP, PDF
          </Text>
        </Form.Item>

        {/* Signature Upload */}
        <Form.Item name="signature" label="Signature (Optional)" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}>
          <div>
            <Upload
              fileList={signatureFileList}
              beforeUpload={() => false}
              onChange={handleSignatureChange}
              onRemove={() => {
                setSignatureFileList([]);
                setSignaturePreview(null);
              }}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              maxCount={1}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>Upload Signature</Button>
            </Upload>
            {signaturePreview && (
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <div style={{ marginBottom: 5 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Signature Preview:
                  </Text>
                </div>
                <img
                  src={signaturePreview}
                  alt="Signature preview"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "80px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "4px",
                    padding: "4px",
                    backgroundColor: "#fff",
                  }}
                />
              </div>
            )}
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

        <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Customer
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SignupOnboardModal;
