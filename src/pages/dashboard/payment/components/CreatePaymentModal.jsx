import React, { useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Button, Spin, DatePicker } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const CreatePaymentModal = ({ visible, onCancel, onSubmit, loading, customers, tariffs }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (!visible) {
            form.resetFields();
        }
    }, [visible, form]);

    return (
        <Modal
            centered
            title="Create Manual Payment Record"
            open={visible}
            onCancel={onCancel}
            footer={null}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <Form.Item name="user_id" label="Select Customer" rules={[{ required: true }]}>
                    <Select showSearch placeholder="Search customer by name or email" filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={customers.map(c => ({ value: c.user_id, label: `${c.name} (${c.email})` }))} />
                </Form.Item>
                <Form.Item name="tariff_id" label="Select Tariff" rules={[{ required: true }]}>
                    <Select placeholder="Select the relevant tariff" options={tariffs.map(t => ({ value: t.tariff_id, label: `${t.tariff_name} (₹${t.fixed_fee})` }))} />
                </Form.Item>
                <Form.Item name="amount_due" label="Amount Due" rules={[{ required: true }]}>
                    <InputNumber style={{ width: '100%' }} min={0} addonBefore="₹" />
                </Form.Item>
                <Form.Item name="payment_cycle_start_date" label="Billing Cycle Start Date" rules={[{ required: true }]}>
                    <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
                    <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {loading ? <Spin size="small" /> : 'Create Payment'}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreatePaymentModal;