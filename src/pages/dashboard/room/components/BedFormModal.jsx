import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Select, Row, Col } from "antd";

const { Option } = Select;

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onCancel
 * @param {(values: any) => void} props.onSubmit
 * @param {any} [props.bed]
 * @param {boolean} props.loading
 * @param {string} props.roomId
 */
const BedFormModal = ({ visible, onCancel, onSubmit, bed, loading, roomId }) => {
  const [form] = Form.useForm();
  const isEditMode = !!bed;

  useEffect(() => {
    if (visible) {
      if (isEditMode) {
        form.setFieldsValue(bed);
      } else {
        form.resetFields();
        form.setFieldsValue({
          bed_status: "AVAILABLE",
          room_id: roomId
        });
      }
    }
  }, [bed, visible, form, isEditMode, roomId]);

  /** @param {any} values */
  const handleSubmit = (values) => {
    onSubmit({ ...values, room_id: roomId });
  };

  return (
    <Modal
      centered
      title={isEditMode ? "Edit Bed" : "Add New Bed"}
      open={visible}
      onCancel={loading ? undefined : onCancel}
      footer={null}
      maskClosable={!loading}
      closable={!loading}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="bed_code"
              label="Bed Code/Name"
              rules={[{ required: true, message: "Please enter a bed code" }]}
              normalize={(value) => value?.toUpperCase()}
            >
              <Input 
                placeholder="e.g., B1, Window Side, Bed-01" 
                onChange={(e) => {
                  const upperValue = e.target.value.toUpperCase();
                  form.setFieldsValue({ bed_code: upperValue });
                }}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="bed_status"
              label="Status"
              rules={[{ required: true, message: "Please select a status" }]}
            >
              <Select placeholder="Select status">
                <Option value="AVAILABLE">Available</Option>
                <Option value="MAINTENANCE">Maintenance</Option>
                <Option value="RESERVED">Reserved</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="notes" label="Notes (Optional)">
              <Input.TextArea rows={3} placeholder="Add any specific details about this bed..." />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} disabled={loading} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditMode ? "Update Bed" : "Add Bed"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BedFormModal;
