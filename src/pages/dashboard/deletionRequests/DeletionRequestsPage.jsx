import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Input,
  message,
  Spin,
  Empty,
  Tag,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchPendingDeletionRequests,
  approveRequest,
  rejectRequest,
  selectDeletionRequests,
  selectDeletionRequestStatus,
} from "../../../redux/deletionRequest/deletionRequestSlice";

const { Title } = Typography;
const { TextArea } = Input;

const DeletionRequestsPage = () => {
  const dispatch = useDispatch();
  const requests = useSelector(selectDeletionRequests);
  const status = useSelector(selectDeletionRequestStatus);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    dispatch(fetchPendingDeletionRequests());
  }, [dispatch]);

  const handleApprove = (request) => {
    const vacatedInfo = request.is_vacated 
      ? "\n\n⚠️ This user has already vacated." 
      : request.vacating_on 
        ? `\n\n📅 Vacating on: ${dayjs(request.vacating_on).format("DD MMM YYYY")}` 
        : "";
    
    Modal.confirm({
      title: "Approve Account Deletion",
      content: `Are you sure you want to approve the deletion request for ${request.name}?${vacatedInfo}\n\nThis action cannot be undone.`,
      okText: "Approve",
      okType: "danger",
      cancelText: "Cancel",
      width: 500,
      onOk: () => {
        dispatch(approveRequest(request.request_id));
      },
    });
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      message.error("Please provide a reason for rejection");
      return;
    }

    if (selectedRequest) {
      dispatch(
        rejectRequest({
          requestId: selectedRequest.request_id,
          rejectionReason: rejectionReason.trim(),
        })
      );
      setRejectModalVisible(false);
      setSelectedRequest(null);
      setRejectionReason("");
    }
  };

  const columns = [
    {
      title: "Request ID",
      dataIndex: "request_id",
      key: "request_id",
      width: 100,
    },
    {
      title: "User Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (name, record) => (
        <Space>
          <span>{name}</span>
          {record.is_vacated && (
            <Tag color="red">Vacated</Tag>
          )}
          {record.vacating_on && !record.is_vacated && (
            <Tag color="orange">Vacating Soon</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "Room",
      key: "room",
      width: 150,
      render: (_, record) => {
        if (record.room_number && record.block_name) {
          return `${record.block_name} - ${record.room_number}`;
        } else if (record.room_number) {
          return record.room_number;
        }
        return "N/A";
      },
    },
    {
      title: "Joined Date",
      dataIndex: "user_joined_date",
      key: "user_joined_date",
      width: 150,
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
    },
    {
      title: "Vacating Date",
      dataIndex: "vacating_on",
      key: "vacating_on",
      width: 150,
      render: (date, record) => {
        if (!date) return "N/A";
        const vacatingDate = dayjs(date);
        const isVacated = record.is_vacated;
        const daysUntil = record.days_until_vacation;
        
        return (
          <div>
            <div>{vacatingDate.format("DD MMM YYYY")}</div>
            {isVacated ? (
              <span style={{ color: "#ff4d4f", fontSize: "12px" }}>Vacated</span>
            ) : daysUntil !== null && daysUntil !== undefined ? (
              <span style={{ color: daysUntil <= 7 ? "#ff4d4f" : "#52c41a", fontSize: "12px" }}>
                {daysUntil > 0 ? `${daysUntil} days left` : "Today"}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Requested At",
      dataIndex: "requested_at",
      key: "requested_at",
      width: 180,
      render: (date) => dayjs(date).format("DD MMM YYYY, h:mm A"),
      sorter: (a, b) => dayjs(a.requested_at).unix() - dayjs(b.requested_at).unix(),
      defaultSortOrder: "ascend",
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            danger
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
            loading={status === "loading"}
          >
            Approve
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
            loading={status === "loading"}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-3">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card size="small">
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Title level={4} style={{ margin: 0 }}>
              <UserDeleteOutlined /> Account Deletion Requests
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => dispatch(fetchPendingDeletionRequests())}
              loading={status === "loading"}
            >
              Refresh
            </Button>
          </Space>
        </Card>

        {requests.length > 0 && (
          <Card size="small">
            <Space>
              <span>
                <strong>Total Requests:</strong> {requests.length}
              </span>
              <span style={{ color: "#ff4d4f" }}>
                <strong>Vacated Users:</strong> {requests.filter(r => r.is_vacated).length}
              </span>
              <span style={{ color: "#faad14" }}>
                <strong>Vacating Soon:</strong> {requests.filter(r => r.vacating_on && !r.is_vacated).length}
              </span>
              <span>
                <strong>Active Users:</strong> {requests.filter(r => !r.vacating_on).length}
              </span>
            </Space>
          </Card>
        )}

        <Card>
          {status === "loading" && requests.length === 0 ? (
            <div className="text-center p-4">
              <Spin size="large" />
            </div>
          ) : requests.length === 0 ? (
            <Empty
              description="No pending deletion requests"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={requests}
              rowKey="request_id"
              loading={status === "loading"}
              scroll={{ x: true }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} requests`,
              }}
            />
          )}
        </Card>

        <Modal
          title="Reject Deletion Request"
          open={rejectModalVisible}
          onOk={handleRejectConfirm}
          onCancel={() => {
            setRejectModalVisible(false);
            setSelectedRequest(null);
            setRejectionReason("");
          }}
          okText="Reject"
          okType="danger"
          cancelText="Cancel"
        >
          <div>
            <p>
              <strong>User:</strong> {selectedRequest?.name} ({selectedRequest?.email})
            </p>
            <p style={{ marginBottom: 16 }}>
              <strong>Reason for rejection:</strong>
            </p>
            <TextArea
              rows={4}
              placeholder="Enter reason for rejecting this deletion request..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
        </Modal>
      </Space>
    </div>
  );
};

export default DeletionRequestsPage;

