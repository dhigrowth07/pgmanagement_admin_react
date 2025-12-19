import React from 'react';
import { Modal, Form, Input, Button, Spin, Alert } from 'antd';

const ChangePasswordModal = ({ visible, onCancel, onSubmit, loading, customer }) => {
  const [form] = Form.useForm();

  if (!customer) return null;

  const handleFinish = (values) => {
    onSubmit(values.newPassword);
    form.resetFields();
  };

  return (
    <Modal
      centered
      title={`Change Password for ${customer.name}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
    >
      <Alert
        message="You are about to reset the password for a customer. They will need to be notified of their new password."
        type="warning"
        showIcon
        className="mb-4"
        style={{ marginBottom: 8}}
      />
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: 'Please enter a new password' },
            { min: 6, message: 'Password must be at least 6 characters long' }
          ]}
          hasFeedback
        >
          <Input.Password placeholder="Enter at least 6 characters" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Confirm New Password"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm the new password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords that you entered do not match!'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Re-enter the new password" />
        </Form.Item>
        <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? <Spin size="small" /> : 'Change Password'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;