import React, { useEffect, useState } from "react";
import { Modal, Form, Select, Input, Button, Spin, InputNumber, Radio, Alert } from "antd";

const { Option } = Select;

const ProcessPaymentModal = ({ visible, onCancel, onSubmit, loading, payment }) => {
  const [form] = Form.useForm();
  const [paymentType, setPaymentType] = useState("full");

  useEffect(() => {
    if (visible && payment) {
      setPaymentType("full");
      // Use balance_payable_amount (actual remaining balance) or stored_amount_due (actual stored value)
      // amount_due is calculated from current tariff and may not reflect actual remaining balance
      const actualAmountDue = Number(payment.balance_payable_amount ?? payment.stored_amount_due ?? payment.amount_due ?? 0);
      form.setFieldsValue({
        payment_method: "online",
        amount_paid: actualAmountDue > 0 ? actualAmountDue : payment.amount_due,
      });
    }
  }, [payment, visible, form]);

  if (!payment) return null;

  // Use balance_payable_amount (actual remaining balance) or stored_amount_due (actual stored value)
  // amount_due is calculated from current tariff and may not reflect actual remaining balance
  const actualAmountDue = Number(payment.balance_payable_amount ?? payment.stored_amount_due ?? payment.amount_due ?? 0);

  const handleFinish = (values) => {
    // Normalize payment method to lowercase to match database constraint
    const normalizedValues = {
      ...values,
      payment_method: values.payment_method.toLowerCase(),
    };

    const payload = {
      type: paymentType, // "full" or "initial"
      paymentId: payment.payment_id,
      data: normalizedValues,
    };
    onSubmit(payload);
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setPaymentType(type);
    if (type === "full") {
      form.setFieldsValue({
        amount_paid: actualAmountDue > 0 ? actualAmountDue : payment.amount_due,
        transaction_reference: undefined,
      });
    } else if (type === "initial") {
      form.setFieldsValue({
        amount_paid: undefined,
        transaction_reference: undefined,
      });
    }
  };

  return (
    <Modal centered title={`Process Payment for ${payment.email}`} open={visible} onCancel={onCancel} footer={null} maskClosable={false}>
      <Alert message={`Amount Due: ₹${Number(payment.amount_due).toLocaleString()}`} type="info" style={{ marginBottom: 16 }} />
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Payment Type" name="paymentType">
          <Radio.Group defaultValue={"full"} onChange={handleTypeChange} value={paymentType}>
            <Radio value="full">Full Payment</Radio>
            <Radio value="initial">Initial Payment (Custom Amount)</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="payment_method" label="Payment Method" rules={[{ required: true, message: "Please select payment method" }]}>
          <Select placeholder="Select payment method">
            <Option value="cash">Cash</Option>
            <Option value="online">Online/UPI</Option>
            <Option value="card">Card</Option>
            <Option value="bank_transfer">Bank Transfer</Option>
            <Option value="cheque">Cheque</Option>
          </Select>
        </Form.Item>

        {/* Show these fields only for Initial Payment */}
        {paymentType === "initial" && (
          <>
            <Form.Item
              name="amount_paid"
              label="Amount Paid"
              rules={[
                { required: true, message: "Amount paid is required" },
                { type: "number", min: 0.01, message: "Amount must be greater than 0" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value <= payment.amount_due) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(`Amount cannot exceed ₹${Number(payment.amount_due).toLocaleString()}`));
                  },
                }),
              ]}
            >
              <InputNumber style={{ width: "100%" }} addonBefore="₹" placeholder="Enter amount paid" min={0.01} max={actualAmountDue} />
            </Form.Item>

            <Form.Item name="transaction_reference" label="Transaction Reference" rules={[{ required: true, message: "Transaction reference is required for initial payment" }]}>
              <Input placeholder="e.g., 1st installment in 5th nov" />
            </Form.Item>
          </>
        )}

        {/* Show transaction reference as optional for Full Payment */}
        {paymentType === "full" && (
          <Form.Item name="transaction_reference" label="Transaction Reference (Optional)">
            <Input placeholder="e.g., UPI transaction ID" />
          </Form.Item>
        )}

        <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? <Spin size="small" /> : "Process Payment"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProcessPaymentModal;
