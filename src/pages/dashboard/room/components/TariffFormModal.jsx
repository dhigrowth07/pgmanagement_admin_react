import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Row, Col, InputNumber } from "antd";

const TariffFormModal = ({ mode, visible, onCancel, tariff, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (visible) {
      if (isEditMode && tariff) {
        // Convert fee values to numbers for InputNumber component
        form.setFieldsValue({
          ...tariff,
          fixed_fee: typeof tariff.fixed_fee === "string" ? parseFloat(tariff.fixed_fee) : Number(tariff.fixed_fee),
          variable_fee:
            tariff.variable_fee !== undefined && tariff.variable_fee !== null ? (typeof tariff.variable_fee === "string" ? parseFloat(tariff.variable_fee) : Number(tariff.variable_fee)) : undefined,
        });
      } else {
        form.resetFields();
      }
    }
  }, [tariff, visible, form, isEditMode]);

  const handleSubmit = (values) => {
    if (!loading) {
      // Convert fee values to numbers (backend expects numbers, not strings)
      const payload = {
        ...values,
      };

      // In edit mode, preserve fixed_fee and variable_fee from the original tariff
      // since these fields are hidden and won't be in the form values
      if (isEditMode && tariff) {
        payload.fixed_fee = typeof tariff.fixed_fee === "string" ? parseFloat(tariff.fixed_fee) : Number(tariff.fixed_fee);
        payload.variable_fee =
          tariff.variable_fee !== undefined && tariff.variable_fee !== null ? (typeof tariff.variable_fee === "string" ? parseFloat(tariff.variable_fee) : Number(tariff.variable_fee)) : undefined;
      } else {
        // In create mode, use the form values
        payload.fixed_fee = typeof values.fixed_fee === "string" ? parseFloat(values.fixed_fee) : Number(values.fixed_fee);
        payload.variable_fee =
          values.variable_fee !== undefined && values.variable_fee !== null ? (typeof values.variable_fee === "string" ? parseFloat(values.variable_fee) : Number(values.variable_fee)) : undefined;
      }

      onSubmit(payload);
    }
  };

  return (
    <Modal centered title={isEditMode ? "Edit Tariff" : "Add New Tariff"} open={visible} onCancel={loading ? undefined : onCancel} footer={null} maskClosable={!loading} closable={!loading}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="tariff_name" label="Tariff Name" rules={[{ required: true, message: "Please enter a name" }]}>
          <Input placeholder="e.g., Standard Single AC" />
        </Form.Item>
        {!isEditMode && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fixed_fee" label="Fixed Fee (Rent)" rules={[{ required: true, message: "Please enter a fixed fee" }]}>
                <InputNumber style={{ width: "100%" }} min={0} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="variable_fee" label="Variable Fee (Optional)">
                <InputNumber style={{ width: "100%" }} min={0} addonBefore="₹" />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="e.g., Includes electricity and maintenance" />
        </Form.Item>
        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} disabled={loading} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditMode ? "Update Tariff" : "Add Tariff"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TariffFormModal;
