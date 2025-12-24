import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Typography, Button, Space, Row, Col, Statistic, Spin } from "antd";
import { ReloadOutlined, FileTextOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  fetchActivityLogs,
  fetchActivityStats,
  fetchActivityLogById,
  deleteAllActivityLogs,
  setFilters,
  clearFilters,
  clearSelectedLog,
  selectActivityLogs,
  selectSelectedLog,
  selectActivityLogsStatus,
  selectActivityLogsError,
  selectActivityLogsFilters,
  selectActivityLogsPagination,
  selectActivityLogsStatistics,
} from "../../../redux/activityLogs/activityLogsSlice";
import { selectUser, selectIsAdmin } from "../../../redux/auth/authSlice";
import ActivityLogsTable from "./ActivityLogsTable";
import ActivityLogsFilters from "./components/ActivityLogsFilters";
import ActivityLogDetailsModal from "./components/ActivityLogDetailsModal";
import DeleteConfirmModal from "../../../components/Modals/DeleteConfirmModal";
import toast from "react-hot-toast";

const { Title } = Typography;

const ActivityLogsPage = () => {
  const dispatch = useDispatch();
  const logs = useSelector(selectActivityLogs);
  const selectedLog = useSelector(selectSelectedLog);
  const status = useSelector(selectActivityLogsStatus);
  const error = useSelector(selectActivityLogsError);
  const filters = useSelector(selectActivityLogsFilters);
  const pagination = useSelector(selectActivityLogsPagination);
  const statistics = useSelector(selectActivityLogsStatistics);
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const filtersRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Initial load
    const initialFilters = { limit: 50, offset: 0 };
    dispatch(setFilters(initialFilters));
    filtersRef.current = initialFilters;
    dispatch(fetchActivityLogs(initialFilters));
    if (isAdmin) {
      dispatch(fetchActivityStats());
    }
    isInitialMount.current = false;
  }, [dispatch, isAdmin]);

  useEffect(() => {
    if (!isInitialMount.current && filters) {
      const filtersKey = JSON.stringify(filters);
      const prevFiltersKey = filtersRef.current ? JSON.stringify(filtersRef.current) : null;

      if (filtersKey !== prevFiltersKey) {
        filtersRef.current = filters;
        dispatch(fetchActivityLogs(filters));
      }
    }
  }, [dispatch, filters]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleFiltersChange = (newFilters) => {
    // Check if this is a reset (only has offset and limit)
    const isReset = Object.keys(newFilters).length === 2 && 
                    newFilters.hasOwnProperty('offset') && 
                    newFilters.hasOwnProperty('limit') &&
                    !newFilters.hasOwnProperty('user_type') &&
                    !newFilters.hasOwnProperty('user_id') &&
                    !newFilters.hasOwnProperty('activity_type') &&
                    !newFilters.hasOwnProperty('activity_category') &&
                    !newFilters.hasOwnProperty('start_date') &&
                    !newFilters.hasOwnProperty('end_date');
    
    if (isReset) {
      // Clear all filters - this resets to initial state which has offset: 0, limit: 50
      dispatch(clearFilters());
    } else {
      dispatch(setFilters(newFilters));
    }
  };

  const handleTableChange = (paginationInfo, filters, sorter) => {
    const newFilters = {
      ...filtersRef.current,
      offset: (paginationInfo.current - 1) * paginationInfo.pageSize,
      limit: paginationInfo.pageSize,
    };
    dispatch(setFilters(newFilters));
  };

  const handleViewDetails = async (log) => {
    try {
      await dispatch(fetchActivityLogById(log.log_id));
      setDetailsModalVisible(true);
    } catch (error) {
      toast.error("Failed to fetch log details");
    }
  };

  const handleRefresh = () => {
    dispatch(fetchActivityLogs(filtersRef.current || { limit: 50, offset: 0 }));
    if (isAdmin) {
      dispatch(fetchActivityStats());
    }
    toast.success("Activity logs refreshed");
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalVisible(false);
    dispatch(clearSelectedLog());
  };

  const handleDeleteAll = () => {
    setDeleteModalVisible(true);
  };

  const handleConfirmDeleteAll = async () => {
    try {
      await dispatch(deleteAllActivityLogs());
      setDeleteModalVisible(false);
      // Logs and stats will be refreshed automatically by the thunk
    } catch (error) {
      // Error is already handled in the thunk with toast
    }
  };

  const isLoading = status === "loading";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="shadow-sm">
        <div className="mb-6">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Title level={2}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              Activity Logs
            </Title>
            <Space>
              {isAdmin && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteAll}
                  loading={isLoading}
                >
                  Delete All Logs
                </Button>
              )}
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isLoading}>
                Refresh
              </Button>
            </Space>
          </div>
          <p className="text-gray-600 mt-2">
            Monitor and track all user and admin activities across the system. View detailed logs, filter by various criteria, and analyze system usage.
          </p>
        </div>

        {isAdmin && statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Logs"
                  value={statistics.total_logs || 0}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Today's Logs"
                  value={statistics.logs_today || 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="User Logs"
                  value={statistics.user_logs || 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Admin Logs"
                  value={statistics.admin_logs || 0}
                />
              </Card>
            </Col>
          </Row>
        )}

        <ActivityLogsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          isAdmin={isAdmin}
          featurePermissions={user?.feature_permissions || {}}
        />

        <Spin spinning={isLoading}>
          <ActivityLogsTable
            logs={logs}
            loading={isLoading}
            pagination={pagination}
            onTableChange={handleTableChange}
            onViewDetails={handleViewDetails}
          />
        </Spin>

        <ActivityLogDetailsModal
          visible={detailsModalVisible}
          onCancel={handleCloseDetailsModal}
          log={selectedLog}
        />

        <DeleteConfirmModal
          visible={deleteModalVisible}
          onCancel={() => setDeleteModalVisible(false)}
          onConfirm={handleConfirmDeleteAll}
          title="Delete All Activity Logs"
          content={`Are you sure you want to delete ALL activity logs? This will permanently remove ${pagination?.total || 0} log(s) and this action cannot be undone.`}
        />
      </Card>
    </div>
  );
};

export default ActivityLogsPage;

