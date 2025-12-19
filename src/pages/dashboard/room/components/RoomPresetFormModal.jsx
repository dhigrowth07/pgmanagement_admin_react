import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Select } from "antd";

const { Option } = Select;

const RoomPresetFormModal = ({ mode, visible, onCancel, preset, tariffs, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (visible) {
      if (isEditMode && preset) {
        form.setFieldsValue(preset);
      } else {
        form.resetFields();
      }
    }
  }, [preset, visible, form, isEditMode]);

  const handleSubmit = (values) => {
    if (!loading) {
      onSubmit(values);
    }
  };

  return (
    <Modal centered title={isEditMode ? "Edit Room Preset" : "Add New Room Preset"} open={visible} onCancel={loading ? undefined : onCancel} footer={null} maskClosable={!loading} closable={!loading}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="preset_name" label="Preset Name" rules={[{ required: true, message: "Please enter a name" }]}>
          <Input placeholder="e.g., Deluxe Double Sharing" />
        </Form.Item>
        <Form.Item name="sharing_type" label="Sharing Type" rules={[{ required: true, message: "Please select a sharing type" }]}>
          <Select placeholder="Select sharing type">
            <Option value="single">Single</Option>
            <Option value="double">Double</Option>
            <Option value="triple">Triple</Option>
            <Option value="quad">Quad</Option>
            <Option value="dormitory">Dormitory</Option>
          </Select>
        </Form.Item>
        <Form.Item name="tariff_id" label="Associated Tariff" rules={[{ required: true, message: "Please select a tariff" }]}>
          <Select placeholder="Select a tariff">
            {tariffs.map((t) => (
              <Option key={t.tariff_id} value={t.tariff_id}>
                {t.tariff_name} (₹{t.fixed_fee})
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="amenities" label="Amenities">
          <Select mode="tags" style={{ width: "100%" }} placeholder="e.g., AC, TV, WiFi (press Enter after each)" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="A short description of the preset" />
        </Form.Item>
        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} disabled={loading} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditMode ? "Update Preset" : "Add Preset"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomPresetFormModal;
