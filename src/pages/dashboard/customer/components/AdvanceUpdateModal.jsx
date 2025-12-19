import React, { useEffect } from 'react';
import { Modal, Form, InputNumber, Button, Spin, Alert } from 'antd';

const AdvanceUpdateModal = ({ visible, onCancel, onSubmit, loading, customer }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && customer) {
            form.setFieldsValue({ amount: customer.advance || 0 });
        }
    }, [visible, customer, form]);

    if (!customer) return null;

    return (
        <Modal
            centered
            title={`Update Advance for ${customer.name}`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <p className="mb-4">
                    Set the new <strong>advance amount</strong> for this customer.
                </p>
                <Form.Item
                    name="amount"
                    label="Advance Amount (₹)"
                    rules={[{ required: true, message: 'Please enter an amount' }]}
                >
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 1500" />
                </Form.Item>

                <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {loading ? <Spin size="small" /> : 'Update Advance'}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AdvanceUpdateModal;
