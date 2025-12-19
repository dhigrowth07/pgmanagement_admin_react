import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Alert, Row, Col } from "antd";

const SignupFormModal = ({ visible, onCancel, onSubmit, loading, error }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) form.resetFields();
  }, [visible, form]);

  const handleFinish = (values) => {
    const payload = {
      name: values.name?.trim() || "",
      email: values.email?.trim() || "",
      phone: values.phone?.trim() || "",
      password: values.password,
    };

    onSubmit(payload);
  };

  return (
    <Modal
      centered
      title="Add New Customer"
      open={visible}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {error && <Alert message={error} type="error" showIcon closable />}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: "Please enter full name" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Enter a valid email address" },
              ]}
            >
              <Input placeholder="user@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: "Please enter phone number" },
                { pattern: /^[0-9]{10}$/, message: "Phone must be 10 digits" },
              ]}
            >
              <Input placeholder="9876543210" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please set a password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password placeholder="******" />
            </Form.Item>
          </Col>
        </Row>

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

export default SignupFormModal;
