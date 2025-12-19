import React, { useEffect } from "react";
import { Modal, Form, Input, Button } from "antd";

const BlockFormModal = ({ mode, visible, onCancel, block, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (visible) {
      if (isEditMode && block) {
        form.setFieldsValue({ block_name: block.block_name });
      } else {
        form.resetFields();
      }
    }
  }, [block, visible, form, isEditMode]);

  const handleSubmit = (values) => {
    if (!loading) {
      onSubmit(values);
    }
  };

  return (
    <Modal centered title={isEditMode ? "Edit Block" : "Add New Block"} open={visible} onCancel={loading ? undefined : onCancel} footer={null} maskClosable={!loading} closable={!loading}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="block_name" label="Block Name" rules={[{ required: true, message: "Please enter a name for the block" }]}>
          <Input placeholder="e.g., Block A, Ladies Hostel" />
        </Form.Item>
        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} disabled={loading} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditMode ? "Update Block" : "Add Block"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BlockFormModal;
