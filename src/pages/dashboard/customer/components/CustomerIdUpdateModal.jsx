import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Spin, Alert } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';

const CustomerIdUpdateModal = ({ visible, onCancel, onSubmit, loading, customer }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && customer) {
      form.setFieldsValue({ customer_id: customer.customer_id || '' });
    }
  }, [customer, visible, form]);

  if (!customer) return null;

  // Validation function for customer_id format
  const validateCustomerId = (_, value) => {
    if (!value) {
      return Promise.resolve(); // Allow empty (will be handled by required rule if needed)
    }
    
    const trimmed = value.trim();
    
    // Check max length
    if (trimmed.length > 20) {
      return Promise.reject(new Error('Customer ID must be 20 characters or less'));
    }
    
    // Check format: PG followed by digits
    const match = trimmed.match(/^PG(\d+)$/);
    if (!match) {
      return Promise.reject(new Error('Invalid format. Expected: PG<number> (e.g., PG01, PG10, PG123)'));
    }
    
    // Check if number part is positive
    const num = parseInt(match[1], 10);
    if (!Number.isFinite(num) || num <= 0) {
      return Promise.reject(new Error('Number part must be a positive integer'));
    }
    
    return Promise.resolve();
  };

  const handleFinish = (values) => {
    onSubmit(values.customer_id.trim());
  };

  return (
    <Modal
      centered
      title={
        <span>
          <IdcardOutlined style={{ marginRight: 8 }} />
          Update Customer ID for {customer.name}
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
      width={500}
    >
      <Alert
        message="Customer ID Update"
        description="Update the unique customer ID. The format must be PG followed by a number (e.g., PG01, PG10, PG123). This ID must be unique within your admin account."
        type="info"
        showIcon
        className="mb-4"
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="customer_id"
          label="Customer ID"
          rules={[
            { required: true, message: 'Please enter a customer ID' },
            { validator: validateCustomerId }
          ]}
          extra="Format: PG followed by numbers (e.g., PG01, PG10, PG123). Maximum 20 characters."
        >
          <Input
            placeholder="Enter customer ID (e.g., PG01)"
            prefix={<IdcardOutlined style={{ color: '#999' }} />}
            maxLength={20}
            style={{ textTransform: 'uppercase' }}
            onInput={(e) => {
              // Auto-uppercase the input
              e.target.value = e.target.value.toUpperCase();
            }}
          />
        </Form.Item>
        {customer.customer_id && (
          <Form.Item label="Current Customer ID">
            <span style={{ 
              display: 'inline-block',
              padding: '4px 12px',
              background: '#f0f0f0',
              borderRadius: '4px',
              fontWeight: 500,
              color: '#666'
            }}>
              {customer.customer_id}
            </span>
          </Form.Item>
        )}
        <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? <Spin size="small" /> : 'Update Customer ID'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerIdUpdateModal;
