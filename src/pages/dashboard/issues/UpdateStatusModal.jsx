import React, { useEffect } from 'react';
import { Modal, Form, Select, Button } from 'antd';

const { Option } = Select;

const UpdateStatusModal = ({ visible, onCancel, issue, onSubmit, loading }) => {
    const [form] = Form.useForm();

    // Database status values
    const issueStatuses = ['unresolved', 'in_progress', 'resolved', 'closed'];
    
    // Status display mapping
    const statusDisplayMap = {
        'unresolved': 'Unresolved',
        'in_progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed',
        // Legacy support
        'open': 'Unresolved',
        'inprogress': 'In Progress',
    };
    
    const isResolved = issue?.status === 'resolved' || issue?.status === 'closed';

    useEffect(() => {
        if (visible && issue) {
            // Map legacy status values to database format
            const statusMap = {
                'open': 'unresolved',
                'inprogress': 'in_progress',
                'resolved': 'resolved',
                'closed': 'closed',
            };
            const normalizedStatus = statusMap[issue.status] || issue.status;
            form.setFieldsValue({ status: normalizedStatus });
        }
    }, [issue, visible, form]);

    const handleFinish = (values) => {
        onSubmit(values.status);
    };

    return (
        <Modal
            centered
            title={`Update Status for Issue #${issue?.issue_id}`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            maskClosable={false}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} disabled={isResolved}>
                <Form.Item
                    name="status"
                    label="Select New Status"
                    rules={[{ required: true, message: 'Please select a status' }]}
                >
                    <Select placeholder="Choose a new status">
                        {issueStatuses.map((s) => (
                            <Option key={s} value={s}>
                                {statusDisplayMap[s] || s.charAt(0).toUpperCase() + s.slice(1)}
                            </Option>
                        ))}
                    </Select>
                    {
                        isResolved && (
                            <p style={{ marginTop: 8, color: 'red' }}>
                                This issue has already been resolved and cannot be updated.
                            </p>
                        )
                    }
                </Form.Item>
                <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={isResolved}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading} disabled={isResolved}>
                        Update Status
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UpdateStatusModal;
