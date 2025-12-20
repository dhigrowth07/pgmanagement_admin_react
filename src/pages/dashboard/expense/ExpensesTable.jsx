import React from "react";
import { Table, Button, Tag, Dropdown, Menu, Tooltip, Image } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, EllipsisOutlined, FileImageOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const ExpensesTable = ({ expenses, loading, onView, onEdit, onDelete, categories = [], meta = {}, onPaginationChange }) => {
  const handleTableChange = (paginationInfo) => {
    if (onPaginationChange) {
      onPaginationChange({
        page: paginationInfo.current,
        per_page: paginationInfo.pageSize,
      });
    }
  };

  const getMenuItems = (record) => {
    return (
      <Menu>
        <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => onView(record)}>
          View Details
        </Menu.Item>
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => onEdit(record)}>
          Edit
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => onDelete(record)}>
          Delete
        </Menu.Item>
      </Menu>
    );
  };

  const formatCurrency = (amountCents, currency = "INR") => {
    const amount = Number(amountCents || 0) / 100;
    if (currency === "INR") {
      return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${currency} ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find((cat) => cat.id === categoryId) || null;
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD MMM, YYYY"),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: "descend",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: {
        showTitle: false,
      },
      render: (title) => (
        <Tooltip placement="topLeft" title={title}>
          {title}
        </Tooltip>
      ),
    },
    {
      title: "Category",
      key: "category",
      render: (_, record) => {
        const category = getCategoryInfo(record.category_id);
        if (!category) {
          return <Tag>N/A</Tag>;
        }
        return (
          <Tag color={category.color || "blue"} icon={category.icon ? <span>{category.icon}</span> : null}>
            {category.name || record.category_name || "N/A"}
          </Tag>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "amount_cents",
      key: "amount",
      render: (amountCents, record) => <span style={{ fontWeight: "bold" }}>{formatCurrency(amountCents, record.currency)}</span>,
      sorter: (a, b) => (a.amount_cents || 0) - (b.amount_cents || 0),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: {
        showTitle: false,
      },
      render: (notes) =>
        notes ? (
          <Tooltip placement="topLeft" title={notes}>
            {notes.length > 50 ? `${notes.substring(0, 50)}...` : notes}
          </Tooltip>
        ) : (
          <span style={{ color: "#999" }}>—</span>
        ),
    },
    {
      title: "Receipt",
      key: "receipt",
      render: (_, record) => {
        if (!record.receipt_url) {
          return <span style={{ color: "#999" }}>—</span>;
        }
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(record.receipt_url);
        return (
          <Tooltip title={isImage ? "View Receipt" : "Open Receipt"}>
            {isImage ? (
              <Image
                width={40}
                height={40}
                src={record.receipt_url}
                alt="Receipt"
                preview={{
                  src: record.receipt_url,
                }}
                style={{ cursor: "pointer", borderRadius: 4 }}
              />
            ) : (
              <Button type="link" icon={<FileImageOutlined />} onClick={() => window.open(record.receipt_url, "_blank")} size="small">
                View
              </Button>
            )}
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Dropdown overlay={getMenuItems(record)} trigger={["click"]}>
          <Button type="text" shape="circle" icon={<EllipsisOutlined style={{ fontSize: "20px" }} />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={expenses}
      rowKey="id"
      loading={loading}
      pagination={{
        current: meta.page || 1,
        pageSize: meta.per_page || 25,
        total: meta.total_count || 0,
        showSizeChanger: true,
        showTotal: (total, range) => (total > 0 ? `${range[0]}-${range[1]} of ${total} expenses` : "No expenses"),
        pageSizeOptions: ["10", "20", "50", "100"],
      }}
      scroll={{ x: "max-content" }}
      onChange={handleTableChange}
      locale={{
        emptyText: "No expenses found",
      }}
    />
  );
};

export default ExpensesTable;
