import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Button } from 'antd';

const { Option } = Select;

const SendAlertModal = ({
    visible,
    onCancel,
    onSubmit,
    loading,
    customers = [],
    submissionSuccess
}) => {
    const [form] = Form.useForm();
    const [target, setTarget] = useState('all');

    const handleFinish = (values) => {
        onSubmit(values);
    };

    const handleTargetChange = (value) => {
        setTarget(value);
        form.setFieldsValue({ userId: undefined });
    };

    useEffect(() => {
        if (!visible || submissionSuccess) {
            form.resetFields();
            setTarget('all');
        }
    }, [visible, submissionSuccess, form]);

    return (
        <Modal
            centered
            title="Send New Alert"
            open={visible}
            onCancel={onCancel}
            footer={null}
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ target: 'all' }}
            >
                <Form.Item
                    name="target"
                    label="Target Audience"
                    rules={[{ required: true }]}
                >
                    <Select onChange={handleTargetChange}>
                        <Option value="all">All Users</Option>
                        <Option value="single">Specific User</Option>
                    </Select>
                </Form.Item>

                {target === 'single' && (
                    <Form.Item
                        name="userId"
                        label="Select User"
                        rules={[{ required: true, message: 'Please select a user' }]}
                    >
                        <Select
                            showSearch
                            placeholder="Search for a user by name or email"
                            filterOption={(input, option) =>
                                option?.children?.toString().toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {(customers || []).map((customer) => (
                                <Option key={customer.user_id} value={customer.user_id}>
                                    {`${customer.name} (${customer.email})`}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                <Form.Item
                    name="title"
                    label="Alert Title"
                    rules={[{ required: true, message: 'Please enter a title' }]}
                >
                    <Input placeholder="e.g., Maintenance Alert" />
                </Form.Item>

                <Form.Item
                    name="body"
                    label="Alert Body"
                    rules={[{ required: true, message: 'Please enter the message body' }]}
                >
                    <Input.TextArea rows={4} placeholder="e.g., Water supply will be unavailable..." />
                </Form.Item>

                <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Send Alert
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SendAlertModal;
