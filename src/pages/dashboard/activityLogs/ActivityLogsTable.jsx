import React, { useState } from "react";
import { Table, Tag, Button, Space, Tooltip } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const ActivityLogsTable = ({ logs, loading, pagination, onTableChange, onViewDetails }) => {
  const getStatusColor = (status) => {
    if (!status) return "default";
    if (status >= 200 && status < 300) return "success";
    if (status >= 300 && status < 400) return "warning";
    if (status >= 400) return "error";
    return "default";
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: "blue",
      POST: "green",
      PUT: "orange",
      PATCH: "purple",
      DELETE: "red",
    };
    return colors[method] || "default";
  };

  const getActivityTypeColor = (type) => {
    if (type?.includes("create")) return "green";
    if (type?.includes("update")) return "blue";
    if (type?.includes("delete")) return "red";
    if (type?.includes("view") || type?.includes("login")) return "cyan";
    return "default";
  };

  const columns = [
    {
      title: "Log ID",
      dataIndex: "log_id",
      key: "log_id",
      width: 80,
      sorter: (a, b) => a.log_id - b.log_id,
    },
    {
      title: "User/Admin",
      key: "user",
      width: 150,
      render: (_, record) => {
        const userType = record.user_type;
        const userId = record.user_id;
        const adminId = record.admin_id;
        
        return (
          <div>
            <Tag color={userType === "admin" ? "purple" : "blue"}>
              {userType === "admin" ? "Admin" : "User"}
            </Tag>
            <div style={{ fontSize: "12px", color: "#8c8c8c", marginTop: 4 }}>
              {userType === "admin" ? `Admin ID: ${adminId?.substring(0, 8)}...` : `User ID: ${userId}`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Activity Type",
      dataIndex: "activity_type",
      key: "activity_type",
      width: 150,
      render: (type) => (
        <Tag color={getActivityTypeColor(type)}>{type || "N/A"}</Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "activity_category",
      key: "activity_category",
      width: 140,
      render: (category) => (
        <Tag color="geekblue">{category || "N/A"}</Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: {
        showTitle: false,
      },
      render: (description) => (
        <Tooltip placement="topLeft" title={description}>
          {description || "N/A"}
        </Tooltip>
      ),
    },
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (endpoint) => (
        <Tooltip placement="topLeft" title={endpoint}>
          <code style={{ fontSize: "12px" }}>{endpoint || "N/A"}</code>
        </Tooltip>
      ),
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      width: 100,
      render: (method) => (
        <Tag color={getMethodColor(method)}>{method || "N/A"}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "response_status",
      key: "response_status",
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status || "N/A"}</Tag>
      ),
    },
    {
      title: "IP Address",
      dataIndex: "ip_address",
      key: "ip_address",
      width: 130,
      render: (ip) => <span style={{ fontSize: "12px" }}>{ip || "N/A"}</span>,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY, h:mm A") : "N/A"),
      defaultSortOrder: "descend",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={logs}
      rowKey="log_id"
      loading={loading}
      pagination={{
        current: Math.floor((pagination?.offset || 0) / (pagination?.limit || 50)) + 1,
        pageSize: pagination?.limit || 50,
        total: pagination?.total || 0,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} log(s)`,
        pageSizeOptions: ["10", "25", "50", "100"],
      }}
      onChange={onTableChange}
      scroll={{ x: "max-content" }}
      size="small"
    />
  );
};

export default ActivityLogsTable;

