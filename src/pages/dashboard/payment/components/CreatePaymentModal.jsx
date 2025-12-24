import React, { useEffect, useState } from "react";
import { Modal, Form, Select, InputNumber, Button, Spin, DatePicker } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import TariffFormModal from "../../room/components/TariffFormModal";
import { addTariff } from "../../../../redux/room/roomSlice";

const { Option } = Select;

const CreatePaymentModal = ({ visible, onCancel, onSubmit, loading, customers, tariffs, initialValues }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [tariffModalVisible, setTariffModalVisible] = useState(false);
  const [isCreatingTariff, setIsCreatingTariff] = useState(false);

  useEffect(() => {
    if (visible) {
      // If initialValues provided (e.g. from a row action), pre-fill the form
      if (initialValues) {
        const { user_id, tariff_id, amount_due, payment_cycle_start_date, due_date } = initialValues;

        // Calculate amount_due from tariff if tariff_id is provided
        let calculatedAmountDue = amount_due;
        if (tariff_id && tariffs && tariffs.length > 0) {
          const selectedTariff = tariffs.find((t) => t.tariff_id === tariff_id);
          if (selectedTariff) {
            calculatedAmountDue = (parseFloat(selectedTariff.fixed_fee) || 0) + (parseFloat(selectedTariff.variable_fee) || 0);
          }
        }

        form.setFieldsValue({
          user_id,
          tariff_id,
          amount_due: calculatedAmountDue,
          payment_cycle_start_date: payment_cycle_start_date ? dayjs(payment_cycle_start_date) : undefined,
          due_date: due_date ? dayjs(due_date) : undefined,
        });
      }
    } else {
      form.resetFields();
    }
  }, [visible, form, initialValues, tariffs]);

  // Handle tariff selection change
  const handleTariffChange = (tariffId) => {
    if (tariffId) {
      const selectedTariff = tariffs.find((t) => t.tariff_id === tariffId);
      if (selectedTariff) {
        // Calculate total tariff amount (fixed_fee + variable_fee)
        const totalAmount = (parseFloat(selectedTariff.fixed_fee) || 0) + (parseFloat(selectedTariff.variable_fee) || 0);
        form.setFieldsValue({
          amount_due: totalAmount,
        });
      }
    } else {
      // Clear amount_due if tariff is cleared
      form.setFieldsValue({
        amount_due: undefined,
      });
    }
  };

  // Handle tariff creation
  const handleTariffSubmit = async (values) => {
    setIsCreatingTariff(true);
    try {
      const result = await dispatch(addTariff(values));
      if (!result.error) {
        // Wait a bit for the tariffs to refresh, then select the new tariff
        setTimeout(() => {
          // The tariffs will be refreshed by the addTariff action
          // We need to find the newly created tariff and select it
          // Since we don't have the new tariff_id immediately, we'll just close the modal
          // The user can manually select it from the refreshed list
          setTariffModalVisible(false);
          setIsCreatingTariff(false);
        }, 500);
      } else {
        setIsCreatingTariff(false);
      }
    } catch {
      setIsCreatingTariff(false);
    }
  };

  // Custom dropdown render for tariff select with "Add New Tariff" option
  const renderTariffDropdown = (menu) => (
    <>
      {menu}
      <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTariffModalVisible(true);
          }}
          style={{ width: "100%", textAlign: "left", padding: "4px 8px" }}
        >
          Add New Tariff
        </Button>
      </div>
    </>
  );

  return (
    <Modal centered title="Create Manual Payment Record" open={visible} onCancel={onCancel} footer={null} maskClosable={false}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item name="user_id" label="Select Customer" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Search customer by name or email"
            filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
            options={customers.map((c) => ({ value: c.user_id, label: `${c.name} (${c.email})` }))}
          />
        </Form.Item>
        <Form.Item name="tariff_id" label="Select Tariff" rules={[{ required: true }]}>
          <Select
            placeholder="Select the relevant tariff"
            options={tariffs.map((t) => ({ value: t.tariff_id, label: `${t.tariff_name} (₹${t.fixed_fee})` }))}
            onChange={handleTariffChange}
            dropdownRender={renderTariffDropdown}
          />
        </Form.Item>
        <Form.Item name="amount_due" label="Amount Due" rules={[{ required: true }]} help="If you want a custom amount, please create a tariff with that amount.">
          <InputNumber style={{ width: "100%" }} min={0} addonBefore="₹" disabled />
        </Form.Item>
        <Form.Item name="payment_cycle_start_date" label="Billing Cycle Start Date" rules={[{ required: true }]}>
          <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="due_date" label="Due Date" rules={[{ required: true }]}>
          <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? <Spin size="small" /> : "Create Payment"}
          </Button>
        </Form.Item>
      </Form>

      {/* Tariff Creation Modal */}
      <TariffFormModal mode="add" visible={tariffModalVisible} onCancel={() => setTariffModalVisible(false)} tariff={null} onSubmit={handleTariffSubmit} loading={isCreatingTariff} />
    </Modal>
  );
};

export default CreatePaymentModal;
