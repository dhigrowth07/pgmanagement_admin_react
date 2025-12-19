import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Row, Col, Select, DatePicker, Upload, Avatar, message } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

const AdminProfileUpdateModal = ({ visible, onCancel, onSubmit, loading, customer }) => {
  const [form] = Form.useForm();
  /** @type {[Array<any>, Function]} */
  const [fileList, setFileList] = useState([]);
  /** @type {[string | null, Function]} */
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);

  // Helper function to normalize gender for display
  const normalizeGenderForDisplay = (gender) => {
    if (!gender) return undefined;
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  // Helper function to normalize gender for submission
  const normalizeGenderForSubmit = (gender) => {
    if (!gender) return "other";
    return gender.toLowerCase();
  };

  useEffect(() => {
    if (visible && customer) {
      form.setFieldsValue({
        name: customer.name,
        phone: customer.phone,
        gender: normalizeGenderForDisplay(customer.gender),
        dob: customer.dob ? dayjs(customer.dob, ["YYYY-MM-DD", "DD-MM-YYYY"]) : null,
        emergency_number_one: customer.emergency_number_one,
        emergency_number_two: customer.emergency_number_two,
      });

      setProfileImagePreview(customer.profile_image_url || null);
      setProfileImageFile(null);

      // Load existing ID proofs
      if (customer.id_proof_urls && customer.id_proof_urls.length > 0) {
        const files = customer.id_proof_urls.map((url, index) => ({
          uid: `existing-${index}-${Date.now()}`,
          name: url.split("/").pop() || `id_proof_${index + 1}`,
          status: "done",
          url,
          isExisting: true,
        }));
        setFileList(files);
      } else {
        setFileList([]);
      }
    } else if (!visible) {
      // Reset when modal closes
      form.resetFields();
      setFileList([]);
      setProfileImagePreview(null);
      setProfileImageFile(null);
    }
  }, [customer, visible, form]);

  if (!customer) return null;

  const phoneRules = [
    { required: true, message: "Please enter a phone number" },
    { pattern: /^[0-9]{10}$/, message: "Phone number must be 10 digits" },
  ];

  const optionalPhoneRules = [{ pattern: /^[0-9]{10}$/, message: "Must be a 10-digit number" }];

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("phone", values.phone);
    formData.append("gender", normalizeGenderForSubmit(values.gender));
    formData.append("dob", values.dob ? values.dob.format("YYYY-MM-DD") : "");
    formData.append("emergency_number_one", values.emergency_number_one || "");
    formData.append("emergency_number_two", values.emergency_number_two || "");

    // Add profile image if changed
    if (profileImageFile) {
      formData.append("profile_image", profileImageFile);
    } else if (customer?.profile_image_url) {
      // Preserve existing profile image if not changed
      formData.append("existing_profile_image_url", customer.profile_image_url);
    }

    fileList.forEach((file) => {
      if (file && !file.isExisting && file.originFileObj) {
        formData.append("id_proofs", file.originFileObj);
      }
    });

    const existingUrls = fileList.filter((f) => f && f.isExisting).map((f) => f.url);
    formData.append("existing_id_proof_urls", JSON.stringify(existingUrls));

    onSubmit(formData);
  };

  // Validate profile image file types (JPEG, PNG, WebP only - no PDF)
  const validateProfileImageType = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const isValidType = allowedTypes.includes(file.type);
    if (!isValidType) {
      message.error(`${file.name} is not a valid file type. Please upload only JPEG, PNG, or WebP images.`);
      return false;
    }
    return true;
  };

  // Validate ID proof file types (JPEG, PNG, WebP, PDF only)
  const validateIdProofFileType = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const isValidType = allowedTypes.includes(file.type);
    if (!isValidType) {
      message.error(`${file.name} is not a valid file type. Please upload only JPEG, PNG, WebP, or PDF files.`);
      return false;
    }
    return true;
  };

  const validateFileUpload = (file) => {
    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error(`${file.name} is too large. Maximum size is 10MB`);
      return false;
    }
    // Validate file type using ID proof validation (JPEG, PNG, WebP, PDF)
    return validateIdProofFileType(file);
  };

  const handleProfileImageChange = (info) => {
    if (info.file) {
      const file = info.file.originFileObj || info.file;

      // Validate file type (JPEG, PNG, WebP only)
      if (!validateProfileImageType(file)) {
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        message.error("Image size must be less than 5MB");
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result && typeof e.target.result === "string") {
          setProfileImagePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal centered title={`Update Profile for ${customer.name}`} open={visible} onCancel={loading ? undefined : onCancel} footer={null} maskClosable={!loading} closable={!loading} width={650}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Avatar size={80} src={profileImagePreview} icon={!profileImagePreview && <UserOutlined />} />
          <div style={{ marginTop: 10 }}>
            <Form.Item
              name="profile_image"
              valuePropName="fileList"
              getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.resolve();
                    }
                    const file = value[0]?.originFileObj || value[0];
                    if (file) {
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxSize) {
                        return Promise.reject(new Error("Profile image must be less than 5MB"));
                      }
                      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                      if (!allowedTypes.includes(file.type)) {
                        return Promise.reject(new Error("Profile image must be JPEG, PNG, or WebP format"));
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Upload
                beforeUpload={(file) => {
                  if (!validateProfileImageType(file)) {
                    return Upload.LIST_IGNORE; // Prevent file from being added to the list
                  }
                  // Validate file size (max 5MB)
                  const maxSize = 5 * 1024 * 1024; // 5MB
                  if (file.size > maxSize) {
                    message.error("Image size must be less than 5MB");
                    return Upload.LIST_IGNORE;
                  }
                  return false; // Prevent auto upload
                }}
                maxCount={1}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleProfileImageChange}
                showUploadList={false}
                disabled={loading}
              >
                <Button size="small" icon={<UploadOutlined />} disabled={loading}>
                  Change Profile Image
                </Button>
              </Upload>
            </Form.Item>
          </div>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[
                { required: true, message: "Please enter a name" },
                { min: 2, message: "Name must be at least 2 characters" },
              ]}
            >
              <Input placeholder="Enter full name" disabled={loading} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email">
              <Input value={customer.email} readOnly disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone" label="Phone Number" rules={phoneRules}>
              <Input placeholder="9876543210" disabled={loading} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender" }]}>
              <Select placeholder="Select Gender" disabled={loading}>
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: "Please select date of birth" }]}>
              <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} disabledDate={(current) => current && current >= dayjs().startOf("day")} placeholder="DD-MM-YYYY" disabled={loading} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="emergency_number_one" label="Emergency Contact 1" rules={optionalPhoneRules}>
              <Input placeholder="Primary emergency contact" disabled={loading} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="emergency_number_two" label="Emergency Contact 2" rules={optionalPhoneRules}>
              <Input placeholder="Secondary emergency contact" disabled={loading} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="ID Proofs">
              <Upload
                multiple
                fileList={fileList}
                beforeUpload={(file) => {
                  if (!validateFileUpload(file)) {
                    return Upload.LIST_IGNORE; // Prevent file from being added to the list
                  }
                  const fileWithProps = {
                    uid: file.uid || `${file.name}-${Date.now()}`,
                    name: file.name || "unknown-file",
                    status: "done",
                    originFileObj: file,
                    isExisting: false,
                  };

                  setFileList((prev) => [...prev, fileWithProps]);
                  return false; // Prevent auto upload
                }}
                onChange={(info) => {
                  // Handle file list changes (including removals)
                  const { fileList: newFileList } = info;
                  setFileList(newFileList);
                }}
                onRemove={(file) => {
                  // Remove file from list
                  setFileList((prev) => prev.filter((f) => f && f.uid !== file.uid));
                  return true; // Allow removal
                }}
                accept="image/jpeg,image/jpg,image/png,image/webp,.pdf,application/pdf"
                listType="text"
                disabled={loading}
              >
                <Button icon={<UploadOutlined />} disabled={loading}>
                  Upload ID Proofs
                </Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} disabled={loading} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} disabled={loading}>
            Update Profile
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdminProfileUpdateModal;
