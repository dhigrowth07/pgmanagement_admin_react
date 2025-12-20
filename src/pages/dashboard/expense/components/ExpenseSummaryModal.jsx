import React from "react";
import { Modal, Typography, List, Card, Progress, Table } from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ExpenseSummaryModal = ({ visible, onCancel, summary }) => {
  const formatCurrency = (amountCents) => {
    const amount = Number(amountCents || 0) / 100;
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalAmount = summary.totalAmountCents || 0;

  const categoryColumns = [
    {
      title: "Category",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Amount",
      dataIndex: "amount_cents",
      key: "amount",
      render: (amountCents) => <Text strong>{formatCurrency(amountCents)}</Text>,
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      key: "percentage",
      render: (percentage) => <Progress percent={Math.round(percentage * 100)} size="small" format={(percent) => `${percent}%`} />,
    },
  ];

  const dayColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Amount",
      dataIndex: "amount_cents",
      key: "amount",
      render: (amountCents) => <Text strong>{formatCurrency(amountCents)}</Text>,
    },
  ];

  return (
    <Modal title={<Title level={4}>Expense Summary</Title>} open={visible} onCancel={onCancel} footer={null} width={800}>
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Title level={5}>Total Amount</Title>
        <Text strong style={{ fontSize: 24 }}>
          {formatCurrency(totalAmount)}
        </Text>
      </Card>

      <Card title="Breakdown by Category" bordered={false} style={{ marginBottom: 16 }}>
        {summary.byCategory && summary.byCategory.length > 0 ? (
          <Table columns={categoryColumns} dataSource={summary.byCategory} rowKey="category_id" pagination={false} size="small" />
        ) : (
          <Text type="secondary">No category data available</Text>
        )}
      </Card>

      <Card title="Breakdown by Day" bordered={false}>
        {summary.byDay && summary.byDay.length > 0 ? (
          <Table columns={dayColumns} dataSource={summary.byDay} rowKey="date" pagination={{ pageSize: 10 }} size="small" />
        ) : (
          <Text type="secondary">No daily data available</Text>
        )}
      </Card>
    </Modal>
  );
};

export default ExpenseSummaryModal;
