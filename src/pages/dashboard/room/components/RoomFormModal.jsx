import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Select, InputNumber, Row, Col } from "antd";

const { Option } = Select;

const RoomFormModal = ({ mode, visible, onCancel, room, blocks, presets, tariffs = [], onSubmit, loading }) => {
  const [form] = Form.useForm();
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (visible) {
      if (isEditMode && room) {
        form.setFieldsValue({
          ...room,
          tariff_id: room?.tariff_id ?? room?.room_tariff_id ?? null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [room, visible, form, isEditMode]);

  const handleSubmit = (values) => {
    if (!loading) {
      onSubmit(values);
    }
  };

  return (
    <Modal centered title={isEditMode ? "Edit Room" : "Add New Room"} open={visible} onCancel={loading ? undefined : onCancel} footer={null} maskClosable={!loading} closable={!loading} width={600}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="room_number" label="Room Number" rules={[{ required: true, message: "Please enter a room number" }]}>
              <Input placeholder="e.g., 101, G-05" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="block_id" label="Block" rules={[{ required: true, message: "Please select a block" }]}>
              <Select placeholder="Select a block">
                {blocks.map((block) => (
                  <Option key={block.block_id} value={block.block_id}>
                    {block.block_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="floor" label="Floor" rules={[{ required: true, message: "Please enter floor number" }]}>
              <InputNumber style={{ width: "100%" }} placeholder="e.g., 0 for Ground, 1, 2" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="capacity" label="Capacity (Beds)" rules={[{ required: true, message: "Please enter capacity" }]}>
              <InputNumber style={{ width: "100%" }} min={1} placeholder="e.g., 1, 2, 3" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="preset_id" label="Room Preset (Type & Amenities)">
          <Select placeholder="Optional: Select a preset" allowClear>
            {presets.map((preset) => (
              <Option key={preset.preset_id} value={preset.preset_id}>
                {preset.preset_name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        {/* <Form.Item name="tariff_id" label="Tariff" rules={[{ required: true, message: 'Please select a tariff' }]}>
                    <Select placeholder="Select a tariff" allowClear showSearch optionFilterProp="children">
                        {tariffs.map((tariff) => (
                            <Option key={tariff.tariff_id} value={tariff.tariff_id}>
                                {tariff.tariff_name} {tariff.fixed_fee ? `(₹${Number(tariff.fixed_fee).toLocaleString()} + ₹${Number(tariff.variable_fee || 0).toLocaleString()})` : ''}
                            </Option>
                        ))}
                    </Select>
                </Form.Item> */}
        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} disabled={loading} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditMode ? "Update Room" : "Add Room"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomFormModal;
