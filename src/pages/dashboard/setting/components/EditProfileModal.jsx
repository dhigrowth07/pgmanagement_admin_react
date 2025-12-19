import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Spin, Row, Col, Select } from "antd";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../redux/auth/authSlice";

const { Option } = Select;

const EditProfileModal = ({ visible, onCancel, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const user = useSelector(selectUser);

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
    if (visible && user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        gender: normalizeGenderForDisplay(user.gender),
        emergency_number_one: user.emergency_number_one,
        emergency_number_two: user.emergency_number_two,
      });
    }
  }, [user, visible, form]);

  const phoneRules = [
    { required: true, message: "Please enter your phone number" },
    { pattern: /^[0-9]{10}$/, message: "Phone number must be 10 digits" },
  ];

  const optionalPhoneRules = [
    {
      pattern: /^[0-9]{10}$/,
      message: "Must be a 10-digit number",
    },
  ];

  const handleSubmit = (values) => {
    // Normalize gender before submission
    const normalizedValues = {
      ...values,
      gender: normalizeGenderForSubmit(values.gender),
    };
    onSubmit(normalizedValues);
  };

  return (
    <Modal centered title="Edit Your Profile" open={visible} onCancel={onCancel} footer={null} maskClosable={false}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="name" label="Full Name">
              <Input readOnly disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="email" label="Email">
              <Input readOnly disabled />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone" label="Phone Number" rules={phoneRules}>
              <Input placeholder="9876543210" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select your gender" }]}>
              <Select placeholder="Select Gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="emergency_number_one" label="Emergency Contact 1" rules={optionalPhoneRules}>
              <Input placeholder="Primary emergency contact" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="emergency_number_two" label="Emergency Contact 2" rules={optionalPhoneRules}>
              <Input placeholder="Secondary emergency contact" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? <Spin size="small" /> : "Update Profile"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
