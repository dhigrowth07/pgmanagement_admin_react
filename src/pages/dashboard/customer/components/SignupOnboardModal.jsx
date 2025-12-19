import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Alert, Row, Col, DatePicker, Select, Upload, Avatar, Typography, message } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { customerNameRules, customerEmailRules, customerPhoneRules, customerPasswordRules, emergencyPhoneRules, dobRules, genderRules } from "../../../../utils/validators";
import { selectAllRooms } from "../../../../redux/room/roomSlice";
import { useSelector } from "react-redux";

const { Option } = Select;
const { Text } = Typography;

const SignupOnboardModal = ({ visible, onCancel, onSubmit, loading, error }) => {
  const [form] = Form.useForm();
  const [profileImageFileList, setProfileImageFileList] = useState([]);
  const [idProofFileList, setIdProofFileList] = useState([]);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const rooms = useSelector(selectAllRooms);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setProfileImageFileList([]);
      setIdProofFileList([]);
      setProfileImagePreview(null);
    }
  }, [visible, form]);

  const handleFinish = (values) => {
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

    onSubmit(formData);
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

  // Get available rooms (vacant rooms)
  const availableRooms = rooms.filter((room) => room.current_occupancy < room.capacity);

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
              <Select placeholder="Select room" showSearch optionFilterProp="children">
                {availableRooms.map((room) => (
                  <Option key={room.room_id} value={room.room_number}>
                    {room.room_number} ({room.current_occupancy}/{room.capacity})
                  </Option>
                ))}
              </Select>
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
