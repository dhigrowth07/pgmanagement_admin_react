import React, { useState } from "react";
import { Table, Button, Tag, Space, Tooltip, Avatar } from "antd";
import { UserOutlined, SwapOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { switchToAdmin, selectUser } from "../../../redux/auth/authSlice";

const AdminsTable = ({ admins, loading }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const handleTableChange = (paginationInfo) => {
    setPagination(paginationInfo);
  };

  const handleSwitchAdmin = async (adminId) => {
    try {
      await dispatch(switchToAdmin(adminId)).unwrap();
      // Toast is handled in the thunk
      // Refresh the page to update all components with new admin context
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      // Error toast is handled in the thunk
      console.error("Switch admin failed:", error);
    }
  };

  const getAdminTypeColor = (adminType) => {
    switch (adminType) {
      case "MAIN ADMIN":
        return "blue";
      case "SUB-ADMIN":
        return "green";
      case "ADDITIONAL ADMIN":
        return "orange";
      default:
        return "default";
    }
  };

  const getStatusColor = (isActive, adminStatus) => {
    if (!isActive || adminStatus !== "active") {
      return "red";
    }
    return "green";
  };

  const columns = [
    {
      title: "Admin",
      key: "admin",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={null} />
          <div>
            <div className="font-medium">{record.admin_name || "N/A"}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "admin_type",
      key: "admin_type",
      render: (type) => (
        <Tag color={getAdminTypeColor(type)}>{type || "N/A"}</Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Tag color={getStatusColor(record.is_active, record.admin_status)}>
          {record.is_active && record.admin_status === "active" ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Phone",
      dataIndex: "admin_phone",
      key: "admin_phone",
      render: (phone) => phone || "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        // Don't show switch button for current admin
        if (record.admin_id === currentUser?.admin_id) {
          return <span className="text-gray-400">Current Account</span>;
        }

        // Only allow switching to active admins
        if (!record.is_active || record.admin_status !== "active") {
          return (
            <Tooltip title="Cannot switch to inactive admin">
              <Button icon={<SwapOutlined />} disabled>
                Switch
              </Button>
            </Tooltip>
          );
        }

        return (
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={() => handleSwitchAdmin(record.admin_id)}
          >
            Switch
          </Button>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={admins}
      rowKey="admin_id"
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: admins?.length || 0,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} admin(s)`,
      }}
      onChange={handleTableChange}
      scroll={{ x: "max-content" }}
    />
  );
};

export default AdminsTable;

