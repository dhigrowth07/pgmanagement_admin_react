import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Space } from "antd";

const CategoryFormModal = ({ visible, onCancel, onSubmit, loading, category }) => {
  const [form] = Form.useForm();
  const isEditMode = !!category;

  useEffect(() => {
    if (visible) {
      if (category) {
        form.setFieldsValue({
          name: category.name,
          icon: category.icon || "",
          color: category.color || "#1890ff",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          color: "#1890ff",
        });
      }
    }
  }, [visible, category, form]);

  const handleSubmit = (values) => {
    onSubmit(values);
  };

  return (
    <Modal centered title={isEditMode ? "Edit Category" : "Create Category"} open={visible} onCancel={onCancel} footer={null} maskClosable={!loading} closable={!loading} width={500}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Category Name"
          rules={[
            { required: true, message: "Please enter category name" },
            { min: 2, message: "Category name must be at least 2 characters" },
          ]}
        >
          <Input placeholder="Enter category name" disabled={loading} />
        </Form.Item>

        <Form.Item name="icon" label="Icon (Optional)">
          <Input placeholder="Enter icon name or emoji" disabled={loading} />
        </Form.Item>

        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Space>
            <Button onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? "Update" : "Create"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CategoryFormModal;
