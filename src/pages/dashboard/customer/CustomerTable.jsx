import React, { useState } from "react";
import { Table, Button, Tag, Space, Tooltip, Avatar, Dropdown, Menu } from "antd";
import dayjs from "dayjs";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  EllipsisOutlined,
  SwapOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  UserAddOutlined,
  DollarCircleOutlined,
  CheckCircleTwoTone,
  StopOutlined,
  ReloadOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const CustomerTable = ({
  customers,
  loading,
  onEdit,
  onView,
  onDelete,
  onChangeTariff,
  onChangeRoom,
  onRemoveFromRoom,
  onChangePassword,
  onAdminUpdateProfile,
  onUpdateAdvance,
  onActivate,
  onReassign,
  onVacateRoom,
  onCancelVacation,
  onViewLogs,
}) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const handleTableChange = (paginationInfo) => {
    setPagination(paginationInfo);
  };

  const getMenuItems = (record) => {
    // Determine if user is Vacated or Inactive
    const displayStatus = record.status || (record.is_active ? "Active" : "Inactive");
    const isVacatedOrInactive = displayStatus === "Vacated" || displayStatus === "Inactive";
    // Check if user has a scheduled vacation (status is "Vacating" or vacating_on exists)
    const hasScheduledVacation = displayStatus === "Vacating" || record.vacating_on;

    return (
      <Menu>
        <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => onView(record)}>
          View Details
        </Menu.Item>
        {onViewLogs && (
          <Menu.Item key="logs" icon={<FileTextOutlined />} onClick={() => onViewLogs(record)}>
            View Logs
          </Menu.Item>
        )}
        {record.room_id && (
          <Menu.Item key="changeRoom" icon={<SwapOutlined />} onClick={() => onChangeRoom(record)}>
            Change Room
          </Menu.Item>
        )}

        {record.room_id && (
          <Menu.Item key="profile" icon={<UserAddOutlined />} onClick={() => onAdminUpdateProfile(record)}>
            Update Profile
          </Menu.Item>
        )}

        {/* Reassign option for Vacated or Inactive users */}
        {isVacatedOrInactive && onReassign && (
          <Menu.Item key="reassign" icon={<ReloadOutlined />} onClick={() => onReassign(record)}>
            Reassign
          </Menu.Item>
        )}

        {record.room_id && (
          <>
            {/* <Menu.Item key="tariff" icon={<SwapOutlined />} onClick={() => onChangeTariff(record)}>
              Change Tariff
            </Menu.Item> */}
            <Menu.Item key="advance" icon={<DollarCircleOutlined />} onClick={() => onUpdateAdvance(record)}>
              Update Advance
            </Menu.Item>
            <Menu.Item key="password" icon={<KeyOutlined />} onClick={() => onChangePassword(record)}>
              Change Password
            </Menu.Item>
            {hasScheduledVacation && onCancelVacation && (
              <Menu.Item key="cancelVacation" icon={<CloseCircleOutlined />} onClick={() => onCancelVacation(record)}>
                Cancel Vacation
              </Menu.Item>
            )}
            {!hasScheduledVacation && onVacateRoom && (
              <Menu.Item key="vacate" icon={<CalendarOutlined />} onClick={() => onVacateRoom(record)}>
                Vacate Room
              </Menu.Item>
            )}
            <Menu.Item key="remove" icon={<LogoutOutlined />} onClick={() => onRemoveFromRoom(record)}>
              Remove from Room
            </Menu.Item>
          </>
        )}

        <Menu.Divider />
      </Menu>
    );
  };

  const columns = [
    {
      title: "Customer",
      dataIndex: "name",
      key: "customer",
      render: (name, record) => (
        <Space>
          <Avatar src={record.profile_image_url} icon={!record.profile_image_url && <UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{name}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Block",
      dataIndex: "block_name",
      key: "block",
      render: (blockName) =>
        blockName ? (
          <Tag color="geekblue" style={{ fontSize: "13px", padding: "4px 12px" }}>
            {blockName}
          </Tag>
        ) : (
          <Tag color="default">No Block</Tag>
        ),
      sorter: (a, b) => {
        const blockA = a.block_name || "";
        const blockB = b.block_name || "";
        return blockA.localeCompare(blockB);
      },
    },
    {
      title: "Room",
      dataIndex: "room_number",
      key: "room",
      render: (roomNumber) =>
        roomNumber ? (
          <Tag color="geekblue" style={{ fontSize: "13px", padding: "4px 12px" }}>
            {roomNumber}
          </Tag>
        ) : (
          <Tag color="default">Unassigned</Tag>
        ),
      sorter: (a, b) => {
        const roomA = a.room_number || "";
        const roomB = b.room_number || "";
        return roomA.localeCompare(roomB);
      },
    },
    {
      title: "Tariff",
      dataIndex: "tariff_name",
      key: "tariff",
      render: (tariffName) =>
        tariffName ? (
          <Tag color="blue" style={{ fontSize: "13px", padding: "4px 12px" }}>
            {tariffName}
          </Tag>
        ) : (
          <Tag color="default">No Tariff</Tag>
        ),
      sorter: (a, b) => {
        const tariffA = a.tariff_name || "";
        const tariffB = b.tariff_name || "";
        return tariffA.localeCompare(tariffB);
      },
    },
    {
      title: "Advance (₹)",
      dataIndex: "advance",
      key: "advance",
      render: (value) => `₹ ${value || 0}`,
    },
    {
      title: "Joining Date",
      dataIndex: "created_at",
      key: "joining_date",
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
      sorter: (a, b) => {
        if (!a.created_at && !b.created_at) return 0;
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        return dayjs(a.created_at).unix() - dayjs(b.created_at).unix();
      },
    },
    {
      title: "Vacating Date",
      dataIndex: "vacated_date",
      key: "vacating_date",
      render: (vacatedDate, record) => {
        // Show vacated_date if exists, otherwise show vacating_on if exists
        const dateToShow = vacatedDate || record.vacating_on;
        if (dateToShow) {
          return dayjs(dateToShow).format("DD MMM YYYY");
        }
        return "N/A";
      },
      sorter: (a, b) => {
        const dateA = a.vacated_date || a.vacating_on;
        const dateB = b.vacated_date || b.vacating_on;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dayjs(dateA).unix() - dayjs(dateB).unix();
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        // Use status from API if available, otherwise fallback to is_active
        const displayStatus = status || (record.is_active ? "Active" : "Inactive");

        const statusConfig = {
          Active: { color: "green", icon: <CheckCircleTwoTone twoToneColor="#52c41a" /> },
          Inactive: { color: "orange", icon: <StopOutlined /> },
          Vacated: { color: "red", icon: <StopOutlined /> },
          Vacating: { color: "orange", icon: <StopOutlined /> },
        };

        const config = statusConfig[displayStatus] || statusConfig.Inactive;

        return (
          <Tag color={config.color} icon={config.icon}>
            {displayStatus}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
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
      dataSource={customers}
      loading={loading}
      rowKey="user_id"
      pagination={{
        ...pagination,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
      }}
      onChange={handleTableChange}
      scroll={{ x: "max-content" }}
      bordered
    />
  );
};

export default CustomerTable;
