import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Button, Space, Card, Select, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateBill,
  fetchBillShares,
  selectElectricityStatus
} from '../../../../redux/electricity/electricitySlice';
import dayjs from 'dayjs';

const { Option } = Select;

const EditBillModal = ({ visible, onCancel, bill, onEdited, onSwitchToShareManagement }) => {
  const dispatch = useDispatch();
  const status = useSelector(selectElectricityStatus);
  const [form] = Form.useForm();
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  useEffect(() => {
    if (visible && bill) {
      // Format the month for the date picker
      const monthValue = bill.month ? dayjs(bill.month + '-01') : null;

      form.setFieldsValue({
        amount: bill.amount,
        month: monthValue,
      });
    }
  }, [visible, bill, form]);

  const handleSubmit = (values) => {
    if (!bill) return;

    // Format month as YYYY-MM
    const formattedMonth = values.month ? values.month.format('YYYY-MM') : bill.month;

    const updateData = {
      amount: values.amount,
      month: formattedMonth,
    };

    dispatch(updateBill({ id: bill.id, data: updateData }))
      .then(() => {
        onEdited?.();
        onCancel();
        form.resetFields();
      });
  };

  const handleMonthChange = (date) => {
    setMonthPickerOpen(false);
  };

  const disabledDate = (current) => {
    // Disable future months
    return current && current > dayjs().endOf('month');
  };

  if (!bill) return null;

  return (
    <Modal
      title={`Edit Bill - ${bill.block_name} ${bill.room_number}`}
      open={visible}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Card size="small" className="mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Room:</strong> {bill.room_number}
            </div>
            <div>
              <strong>Block:</strong> {bill.block_name}
            </div>
            <div>
              <strong>Current Amount:</strong> ₹{bill.amount}
            </div>
            <div>
              <strong>Status:</strong> {bill.status || 'Draft'}
            </div>
          </div>
        </Card>

        <Form.Item
          name="month"
          label="Billing Month"
          rules={[{ required: true, message: 'Please select billing month' }]}
        >
          <DatePicker
            picker="month"
            placeholder="Select month"
            format="YYYY-MM"
            disabledDate={disabledDate}
            onChange={handleMonthChange}
            open={monthPickerOpen}
            onOpenChange={setMonthPickerOpen}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Bill Amount"
          rules={[
            { required: true, message: 'Please enter bill amount' },
            { type: 'number', min: 0, message: 'Amount must be positive' }
          ]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            placeholder="Enter bill amount"
            prefix="₹"
          />
        </Form.Item>

        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-700 mb-3">
            <strong>Note:</strong> Changing the bill amount will automatically recalculate all user shares proportionally.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              To add or remove users from this bill:
            </span>
            <Button
              size="small"
              type="link"
              onClick={() => {
                onCancel();
                onSwitchToShareManagement?.();
              }}
              className="p-0 h-auto text-blue-600 hover:text-blue-800"
            >
              Go to Manual Share Management →
            </Button>
          </div>
        </div>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={status === 'loading_action'}
            >
              Update Bill
            </Button>
            <Button onClick={() => {
              onCancel();
              form.resetFields();
            }}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditBillModal;
