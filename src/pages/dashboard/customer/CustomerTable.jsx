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
  CloseOutlined,
  IdcardOutlined,
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
  onReject,
  onReassign,
  onVacateRoom,
  onCancelVacation,
  onViewLogs,
  onUpdateCustomerId,
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
    // Check registration status
    const registrationStatus = record.registration_status || "pending";
    const isPending = registrationStatus === "pending";
    const isRejected = registrationStatus === "rejected";

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

        {/* Approve/Reject actions for pending users */}
        {isPending && (
          <>
            <Menu.Divider />
            {onActivate && (
              <Menu.Item key="approve" icon={<CheckCircleOutlined />} onClick={() => onActivate(record)}>
                Approve Registration
              </Menu.Item>
            )}
            {onReject && (
              <Menu.Item key="reject" icon={<CloseOutlined />} onClick={() => onReject(record)} danger>
                Reject Registration
              </Menu.Item>
            )}
            <Menu.Divider />
          </>
        )}

        {/* Only show room management options if user is not pending */}
        {!isPending && (
          <>
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

            {/* Reassign option for Vacated or Inactive users (but not rejected) */}
            {isVacatedOrInactive && !isRejected && onReassign && (
              <Menu.Item key="reassign" icon={<ReloadOutlined />} onClick={() => onReassign(record)}>
                Reassign
              </Menu.Item>
            )}

            {/* Customer ID update - available for all non-pending users */}
            {onUpdateCustomerId && (
              <Menu.Item key="updateCustomerId" icon={<IdcardOutlined />} onClick={() => onUpdateCustomerId(record)}>
                Update Customer ID
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
                {hasScheduledVacation && (
                  <>
                    {onVacateRoom && (
                      <Menu.Item key="updateVacation" icon={<CalendarOutlined />} onClick={() => onVacateRoom(record)}>
                        Update Vacation Date
                      </Menu.Item>
                    )}
                    {onCancelVacation && (
                      <Menu.Item key="cancelVacation" icon={<CloseCircleOutlined />} onClick={() => onCancelVacation(record)}>
                        Cancel Vacation
                      </Menu.Item>
                    )}
                  </>
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
      title: "Customer ID",
      dataIndex: "customer_id",
      key: "customer_id",
      render: (customerId) =>
        customerId ? (
          <Tag color="purple" style={{ fontSize: "13px", padding: "4px 12px", fontWeight: 500 }}>
            {customerId}
          </Tag>
        ) : (
          <Tag color="default">N/A</Tag>
        ),
      sorter: (a, b) => {
        const idA = a.customer_id || "";
        const idB = b.customer_id || "";
        return idA.localeCompare(idB);
      },
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
      dataIndex: "joining_date",
      key: "joining_date",
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
      sorter: (a, b) => {
        if (!a.joining_date && !b.joining_date) return 0;
        if (!a.joining_date) return 1;
        if (!b.joining_date) return -1;
        return dayjs(a.joining_date).unix() - dayjs(b.joining_date).unix();
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
          const date = dayjs(dateToShow);
          const today = dayjs().startOf('day');
          const isCustomDate = record.vacating_on && !vacatedDate; // Custom date if it's a future vacating_on
          const daysLeft = isCustomDate ? date.startOf('day').diff(today, 'day') : null;

          return (
            <Tooltip
              title={
                isCustomDate
                  ? `Scheduled to vacate on ${date.format("DD MMMM, YYYY")}${daysLeft !== null ? ` (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left)` : ""}`
                  : `Vacated on ${date.format("DD MMMM, YYYY")}`
              }
            >
              <Space>
                <span>{date.format("DD MMM YYYY")}</span>
                {isCustomDate && daysLeft !== null && daysLeft > 0 && (
                  <Tag color="orange" style={{ fontSize: "11px" }}>
                    {daysLeft}d left
                  </Tag>
                )}
                {isCustomDate && daysLeft === 0 && (
                  <Tag color="red" style={{ fontSize: "11px" }}>
                    Last day
                  </Tag>
                )}
              </Space>
            </Tooltip>
          );
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
      title: "Registration Status",
      dataIndex: "registration_status",
      key: "registration_status",
      render: (registrationStatus, record) => {
        const status = registrationStatus || "pending";
        const statusConfig = {
          approved: { color: "green", text: "Approved" },
          pending: { color: "orange", text: "Pending" },
          rejected: { color: "red", text: "Rejected" },
        };

        const config = statusConfig[status] || statusConfig.pending;

        return <Tag color={config.color}>{config.text}</Tag>;
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
      render: (_, record) => {
        const registrationStatus = record.registration_status || "pending";
        const isPending = registrationStatus === "pending";

        return (
          <Space>
            {/* Quick action buttons for pending users */}
            {isPending && (
              <>
                {onActivate && (
                  <Tooltip title="Approve Registration">
                    <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => onActivate(record)} style={{ marginRight: 4 }}>
                      Approve
                    </Button>
                  </Tooltip>
                )}
                {onReject && (
                  <Tooltip title="Reject Registration">
                    <Button danger size="small" icon={<CloseOutlined />} onClick={() => onReject(record)} style={{ marginRight: 4 }}>
                      Reject
                    </Button>
                  </Tooltip>
                )}
              </>
            )}
            <Dropdown overlay={getMenuItems(record)} trigger={["click"]}>
              <Button type="text" shape="circle" icon={<EllipsisOutlined style={{ fontSize: "20px" }} />} />
            </Dropdown>
          </Space>
        );
      },
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
