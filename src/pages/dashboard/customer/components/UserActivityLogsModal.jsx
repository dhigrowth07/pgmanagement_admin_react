import React, { useState, useEffect } from "react";
import { Modal, Spin, Typography, Tag, Empty } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import ActivityLogsTable from "../../activityLogs/ActivityLogsTable";
import ActivityLogDetailsModal from "../../activityLogs/components/ActivityLogDetailsModal";
import { getUserActivityLogs } from "../../../../services/activityLogsService";
import { fetchActivityLogById } from "../../../../redux/activityLogs/activityLogsSlice";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

const { Title } = Typography;

const UserActivityLogsModal = ({ visible, onCancel, customer }) => {
  const dispatch = useDispatch();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false,
  });
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (visible && customer?.user_id) {
      fetchLogs();
    } else {
      // Reset state when modal closes
      setLogs([]);
      setPagination({
        total: 0,
        limit: 50,
        offset: 0,
        has_more: false,
      });
    }
  }, [visible, customer?.user_id]);

  const fetchLogs = async (params = { limit: 50, offset: 0 }) => {
    if (!customer?.user_id) return;

    setLoading(true);
    try {
      const response = await getUserActivityLogs(customer.user_id, params);
      const data = response.data?.data || {};
      setLogs(data.logs || []);
      setPagination(data.pagination || {
        total: 0,
        limit: 50,
        offset: 0,
        has_more: false,
      });
    } catch (error) {
      console.error("Error fetching user activity logs:", error);
      toast.error("Failed to fetch activity logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (paginationInfo) => {
    const newParams = {
      limit: paginationInfo.pageSize,
      offset: (paginationInfo.current - 1) * paginationInfo.pageSize,
    };
    fetchLogs(newParams);
  };

  const handleViewDetails = async (log) => {
    try {
      await dispatch(fetchActivityLogById(log.log_id));
      setSelectedLog(log);
      setDetailsModalVisible(true);
    } catch (error) {
      toast.error("Failed to fetch log details");
    }
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedLog(null);
  };

  if (!customer) return null;

  return (
    <>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined />
            <span>Activity Logs - {customer.name}</span>
          </div>
        }
        open={visible}
        onCancel={onCancel}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: "70vh", overflow: "auto" }}
      >
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue">User ID: {customer.user_id}</Tag>
          <Tag color="geekblue">Email: {customer.email}</Tag>
          {pagination.total > 0 && (
            <Tag color="green">Total Logs: {pagination.total}</Tag>
          )}
        </div>

        <Spin spinning={loading}>
          {logs.length === 0 && !loading ? (
            <Empty
              description="No activity logs found for this user"
              style={{ padding: "40px 0" }}
            />
          ) : (
            <ActivityLogsTable
              logs={logs}
              loading={loading}
              pagination={pagination}
              onTableChange={handleTableChange}
              onViewDetails={handleViewDetails}
            />
          )}
        </Spin>
      </Modal>

      <ActivityLogDetailsModal
        visible={detailsModalVisible}
        onCancel={handleCloseDetailsModal}
        log={selectedLog}
      />
    </>
  );
};

export default UserActivityLogsModal;

