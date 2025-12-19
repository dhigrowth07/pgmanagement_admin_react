import React, { useEffect } from 'react';
import { Modal, Form, Select, Button, Spin } from 'antd';

const { Option } = Select;

const TariffChangeModal = ({ visible, onCancel, onSubmit, loading, customer, tariffs }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && customer) {
            form.setFieldsValue({ tariff_id: customer.tariff_id });
        }
    }, [customer, visible, form]);

    if (!customer) return null;

    return (
        <Modal
            centered
            title={`Change Tariff for ${customer.name}`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <p className="mb-4">Select a new tariff for this customer. This will be used for future payment calculations.</p>
                <Form.Item
                    name="tariff_id"
                    label="Tariff Plan"
                    rules={[{ required: true, message: 'Please select a tariff' }]}
                >
                    <Select placeholder="Select a tariff">
                        {tariffs.map(t => (
                            <Option key={t.tariff_id} value={t.tariff_id}>
                                {t.tariff_name} (₹{t.fixed_fee})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        {loading ? <Spin size="small" /> : 'Update Tariff'}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default TariffChangeModal;