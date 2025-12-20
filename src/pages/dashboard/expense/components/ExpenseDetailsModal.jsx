import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Descriptions, Tag, Typography, Spin, Image, Table } from "antd";
import dayjs from "dayjs";
import { fetchExpenseById, selectExpenseStatus } from "../../../../redux/expense/expenseSlice";

const { Title, Text } = Typography;

const ExpenseDetailsModal = ({ visible, onCancel, expenseId }) => {
  const dispatch = useDispatch();
  const status = useSelector(selectExpenseStatus);
  const [expenseData, setExpenseData] = React.useState(null);

  useEffect(() => {
    if (visible && expenseId) {
      dispatch(fetchExpenseById(expenseId))
        .unwrap()
        .then((data) => {
          setExpenseData(data);
        })
        .catch((error) => {
          console.error("Error fetching expense:", error);
          setExpenseData(null);
        });
    } else {
      setExpenseData(null);
    }
  }, [visible, expenseId, dispatch]);

  if (!expenseData || !expenseData.expense) {
    return (
      <Modal title={<Title level={4}>Expense Details</Title>} open={visible} onCancel={onCancel} footer={null} width={700}>
        {status === "loading" ? (
          <div className="text-center p-4">
            <Spin />
          </div>
        ) : (
          <div className="text-center p-4">
            <Text type="secondary">Expense not found</Text>
          </div>
        )}
      </Modal>
    );
  }

  const expense = expenseData.expense;
  const history = expenseData.history || [];

  const formatCurrency = (amountCents, currency = "INR") => {
    const amount = Number(amountCents || 0) / 100;
    if (currency === "INR") {
      return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${currency} ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const historyColumns = [
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action) => <Tag color={action === "create" ? "green" : action === "update" ? "blue" : "red"}>{action.toUpperCase()}</Tag>,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("DD MMM YYYY, h:mm A"),
    },
    {
      title: "Changed By",
      dataIndex: "performed_by",
      key: "performed_by",
      render: (userId) => userId || "System",
    },
  ];

  const isImageUrl = expense.receipt_url && /\.(jpg|jpeg|png|gif|webp)$/i.test(expense.receipt_url);

  return (
    <Modal title={<Title level={4}>Expense Details</Title>} open={visible} onCancel={onCancel} footer={null} width={700}>
      <Descriptions bordered column={2} size="small" className="mb-6">
        <Descriptions.Item label="Title" span={2}>
          <Text strong>{expense.title || "N/A"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          <Tag color={expense.category?.color || "blue"} icon={expense.category?.icon ? <span>{expense.category.icon}</span> : null}>
            {expense.category_name || expense.category?.name || "N/A"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Amount">
          <Text strong style={{ fontSize: 16 }}>
            {formatCurrency(expense.amount_cents, expense.currency)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Currency">
          <Text>{expense.currency || "INR"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Date">{dayjs(expense.date).format("DD MMM YYYY")}</Descriptions.Item>
        <Descriptions.Item label="Notes" span={2}>
          <Text>{expense.notes || "—"}</Text>
        </Descriptions.Item>
        {expense.receipt_url && (
          <Descriptions.Item label="Receipt" span={2}>
            {isImageUrl ? (
              <Image width={200} src={expense.receipt_url} alt="Receipt" style={{ borderRadius: 4 }} />
            ) : (
              <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                <Text type="link">View Receipt</Text>
              </a>
            )}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Created At">{dayjs(expense.created_at).format("DD MMM YYYY, h:mm A")}</Descriptions.Item>
        <Descriptions.Item label="Updated At">{dayjs(expense.updated_at).format("DD MMM YYYY, h:mm A")}</Descriptions.Item>
      </Descriptions>

      {history.length > 0 && (
        <>
          <Title level={5} style={{ marginTop: 20 }}>
            History
          </Title>
          <Table columns={historyColumns} dataSource={history} rowKey="id" pagination={false} size="small" />
        </>
      )}
    </Modal>
  );
};

export default ExpenseDetailsModal;
