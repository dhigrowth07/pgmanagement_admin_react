import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, DatePicker, Select, Upload, Row, Col, Alert, Avatar, message } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { customerNameRules, customerEmailRules, customerPhoneRules, dobRules, genderRules } from "../../../../utils/validators";

const { Option } = Select;

const OnboardingFormModal = ({ visible, onCancel, customer, onSubmit, loading, error, rooms, blocks, mode = "full" }) => {
  const [form] = Form.useForm();
  /** @type {[string | null, Function]} */
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  /** @type {[Array<any>, Function]} */
  const [fileList, setFileList] = useState([]);

  // Only show rooms with available beds (current_occupancy < capacity)
  const groupedRooms = (blocks || [])
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
            value: room.room_id,
          };
        }),
      };
    })
    .filter((group) => group.options.length > 0);

  useEffect(() => {
    if (visible) {
      if (mode === "full" && customer) {
        form.setFieldsValue({
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          dob: customer.dob ? dayjs(customer.dob) : null,
          gender: customer.gender || null,
          emergency_number_one: customer.emergency_number_one || "",
          emergency_number_two: customer.emergency_number_two || "",
          room_id: customer.room_id || null,
        });
        setProfileImagePreview(customer.profile_image_url || null);

        // Load existing ID proofs
        if (customer.id_proof_urls && customer.id_proof_urls.length > 0) {
          const existingFiles = customer.id_proof_urls.map((url, index) => ({
            uid: `existing-${index}`,
            name: url.split("/").pop(),
            status: "done",
            url,
            isExisting: true,
          }));
          setFileList(existingFiles);
        } else {
          setFileList([]);
        }
      } else if (mode === "roomChange" && customer) {
        form.setFieldsValue({
          room_id: customer.room_id || null,
        });
      } else if (!customer) {
        form.resetFields();
        setProfileImagePreview(null);
        setFileList([]);
      }
    }
  }, [visible, customer, form, mode]);

  const handleFinish = (values) => {
    const formData = new FormData();

    const finalData = {
      name: mode === "full" ? values.name?.trim() : customer?.name,
      email: mode === "full" ? values.email?.trim() : customer?.email,
      phone: mode === "full" ? values.phone?.trim() : customer?.phone,
      dob: mode === "full" ? values.dob?.format("YYYY-MM-DD") ?? null : customer?.dob ?? null,
      gender: mode === "full" ? values.gender?.toLowerCase() : customer?.gender?.toLowerCase(),
      emergency_number_one: mode === "full" ? values.emergency_number_one?.trim() : customer?.emergency_number_one,
      emergency_number_two: mode === "full" ? values.emergency_number_two?.trim() : customer?.emergency_number_two,
      room_id: values.room_id || customer?.room_id || "",
    };

    Object.entries(finalData).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, val);
      }
    });

    if (mode === "full") {
      // Add new ID proof files
      fileList.forEach((file) => {
        if (file && !file.isExisting && file.originFileObj) {
          formData.append("id_proofs", file.originFileObj);
        }
      });

      // Add existing ID proof URLs
      const existingUrls = fileList.filter((f) => f && f.isExisting).map((f) => f.url);
      if (existingUrls.length > 0) {
        formData.append("existing_id_proof_urls", JSON.stringify(existingUrls));
      }
    }

    if (mode === "full") {
      if (values.profile_image?.length) {
        const profileFile = values.profile_image[0];
        if (profileFile.originFileObj) {
          formData.append("profile_image", profileFile.originFileObj);
        }
      } else if (customer?.profile_image_url) {
        // If no new profile image is uploaded, preserve the existing one
        formData.append("existing_profile_image_url", customer.profile_image_url);
      }
    }

    if (customer?.user_id) {
      onSubmit({ userId: customer.user_id, customerData: formData });
    } else {
      onSubmit(formData);
    }
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

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setProfileImagePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
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

  const modalTitle = mode === "full" ? (customer?.user_id ? `Reassign ${customer?.name || "Customer"}` : "Onboard New Customer") : `Change Room for ${customer?.name || "Customer"}`;
  const submitText = mode === "full" ? (customer?.user_id ? "Reassign Customer" : "Onboard Customer") : "Change Room";

  return (
    <Modal centered title={modalTitle} open={visible} onCancel={onCancel} footer={null} maskClosable={false} width={600}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {error && <Alert message={error} type="error" showIcon closable />}

        {mode === "full" && (
          <>
            <Form.Item name="name" label="Full Name" rules={customerNameRules}>
              <Input placeholder="Enter full name" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="email" label="Email" rules={customerEmailRules}>
                  <Input type="email" placeholder="Enter email address" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="phone" label="Phone Number" rules={customerPhoneRules}>
                  <Input placeholder="Enter 10-digit phone number" maxLength={10} />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Avatar size={80} src={profileImagePreview} icon={!profileImagePreview && <UserOutlined />} />
            </div>

            <Form.Item
              name="profile_image"
              label="Profile Image (Optional)"
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
                listType="picture"
                onRemove={() => setProfileImagePreview(customer?.profile_image_url || null)}
              >
                <Button icon={<UploadOutlined />}>Upload Profile Image</Button>
              </Upload>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="dob" label="Date of Birth" rules={dobRules}>
                  <DatePicker
                    format="DD-MM-YYYY"
                    style={{ width: "100%" }}
                    defaultPickerValue={dayjs().subtract(16, "year")}
                    disabledDate={(current) => current && current >= dayjs().startOf("day")}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="gender" label="Gender" rules={genderRules}>
                  <Select placeholder="Select Gender">
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="id_proofs"
              label="Upload ID Proofs"
              rules={[
                {
                  validator: () => {
                    if (fileList.length === 0) {
                      return Promise.reject(new Error("Please upload at least one ID proof"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
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
                onRemove={(file) => {
                  setFileList((prev) => prev.filter((f) => f && f.uid !== file.uid));
                }}
                accept="image/jpeg,image/jpg,image/png,image/webp,.pdf,application/pdf"
                listType="text"
              >
                <Button icon={<UploadOutlined />}>Upload Documents (Images/PDF, Max 10MB each)</Button>
              </Upload>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="emergency_number_one"
                  label="Emergency Contact 1"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value || value.trim() === "") {
                          return Promise.resolve();
                        }
                        const phoneRegex = /^[0-9]{10}$/;
                        const cleanedValue = value.trim().replace(/[\s\-()]/g, "");
                        if (!phoneRegex.test(cleanedValue)) {
                          return Promise.reject(new Error("Must be a valid 10-digit number"));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input placeholder="10-digit phone number" maxLength={10} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="emergency_number_two"
                  label="Emergency Contact 2"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value || value.trim() === "") {
                          return Promise.resolve();
                        }
                        const phoneRegex = /^[0-9]{10}$/;
                        const cleanedValue = value.trim().replace(/[\s\-()]/g, "");
                        if (!phoneRegex.test(cleanedValue)) {
                          return Promise.reject(new Error("Must be a valid 10-digit number"));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input placeholder="10-digit phone number" maxLength={10} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Form.Item name="room_id" label="Assign Room" rules={[{ required: true, message: "Please select a room" }]}>
          <Select placeholder="Select a room" options={groupedRooms} showSearch optionFilterProp="label" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? "Processing..." : submitText}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OnboardingFormModal;
