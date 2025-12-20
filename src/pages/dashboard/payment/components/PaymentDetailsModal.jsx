import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Descriptions, Tag, Typography, Spin, Table } from "antd";
import dayjs from "dayjs";
import { clearTransactions, fetchTransactions, selectTransactions, selectPaymentStatus } from "../../../../redux/payment/paymentSlice";

const { Title, Text } = Typography;

const statusColors = { paid: "success", due: "error", rolled_over: "default" };

const PaymentDetailsModal = ({ visible, onCancel, payment }) => {
  const dispatch = useDispatch();
  const transactions = useSelector(selectTransactions);
  const status = useSelector(selectPaymentStatus);

  useEffect(() => {
    if (visible && payment?.payment_id) {
      dispatch(fetchTransactions(payment.payment_id));
    }
    return () => {
      if (visible) dispatch(clearTransactions());
    };
  }, [visible, payment, dispatch]);

  if (!payment) return null;
  console.log("payment: ", payment);
  console.log("Room data check:", {
    room_number: payment.room_number,
    block_name: payment.block_name,
    room_id: payment.room_id || "N/A",
  });

  const transactionColumns = [
    { title: "Date", dataIndex: "payment_date", render: (date) => dayjs(date).format("DD MMM YYYY, h:mm A") },
    { title: "Amount Paid", dataIndex: "amount_paid", render: (amount) => `₹${Number(amount).toLocaleString()}` },
    { title: "Method", dataIndex: "payment_method" },
    { title: "Reference", dataIndex: "transaction_reference", render: (ref) => ref || "N/A" },
  ];

  return (
    <Modal title={<Title level={4}>Payment Details</Title>} open={visible} onCancel={onCancel} footer={null} width={700}>
      <Descriptions bordered column={2} size="small" className="mb-6">
        <Descriptions.Item label="Name">
          <Text strong>{payment.name || "N/A"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Phone">
          <Text>{payment.phone || "N/A"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Email" span={2}>
          <Text>{payment.email || "N/A"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Room Number">
          <Text>{payment.room_number ? `${payment.block_name ? payment.block_name + " - " : ""}${payment.room_number}` : "N/A"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={statusColors[payment.status] || "default"}>{payment.status.toUpperCase()}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Amount Due" span={2}>
          <Text strong style={{ fontSize: 16 }}>
            ₹{Number(payment.balance_payable_amount ?? payment.stored_amount_due ?? payment.amount_due ?? 0).toLocaleString()}
            {payment.balance_payable_amount !== undefined && payment.balance_payable_amount !== Number(payment.amount_due) && (
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                (Calculated: ₹{Number(payment.amount_due).toLocaleString()})
              </Text>
            )}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Billing Cycle">{dayjs(payment.payment_cycle_start_date).format("DD MMM YYYY")}</Descriptions.Item>
        <Descriptions.Item label="Due Date">{dayjs(payment.due_date).format("DD MMM YYYY")}</Descriptions.Item>
        <Descriptions.Item label="Paid On">{payment.payment_date ? dayjs(payment.payment_date).format("DD MMM YYYY") : "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Tariff">{payment.tariff_name}</Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 20 }}>
        Transaction History
      </Title>
      {status === "loading_transactions" ? (
        <div className="text-center p-4">
          <Spin />
        </div>
      ) : (
        <Table columns={transactionColumns} dataSource={transactions} rowKey="transaction_id" pagination={false} size="small" />
      )}
    </Modal>
  );
};

export default PaymentDetailsModal;
