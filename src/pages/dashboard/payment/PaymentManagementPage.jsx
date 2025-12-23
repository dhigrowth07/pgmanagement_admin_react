import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Input, Row, Col, Typography, Select, DatePicker, Spin, Tooltip, Space } from "antd";
import { PlusOutlined, SearchOutlined, SyncOutlined } from "@ant-design/icons";
import { CalendarDays, AlarmClock, BadgeIndianRupee, AlertTriangle } from "lucide-react";

import {
  fetchPayments,
  fetchStatistics,
  createNewPayment,
  processPayment,
  removePayment,
  generatePayments,
  selectPayments,
  selectPaymentStatistics,
  selectPaymentStatus,
} from "../../../redux/payment/paymentSlice";
import { fetchAllCustomers, selectAllCustomers } from "../../../redux/customer/customerSlice";
import { fetchRoomsData, selectAllTariffs } from "../../../redux/room/roomSlice";
import { fetchUserBills } from "../../../redux/electricity/electricitySlice";
import { selectUser } from "../../../redux/auth/authSlice";

import PaymentTable from "./PaymentTable";
import CreatePaymentModal from "./components/CreatePaymentModal";
import ProcessPaymentModal from "./components/ProcessPaymentModal";
import PaymentDetailsModal from "./components/PaymentDetailsModal";
import DeleteConfirmModal from "../../../components/Modals/DeleteConfirmModal";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

const { Title } = Typography;
const { Option } = Select;

const PaymentManagementPage = () => {
  const dispatch = useDispatch();
  const payments = useSelector(selectPayments);
  const stats = useSelector(selectPaymentStatistics);
  const status = useSelector(selectPaymentStatus);
  const customers = useSelector(selectAllCustomers);
  const tariffs = useSelector(selectAllTariffs);
  const user = useSelector(selectUser);
  const isPaymentEnabled = user?.feature_permissions?.is_payment_enabled;

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [filters, setFilters] = useState({ search: "", status: "all", dateRange: [] });
  const [userElectricityBills, setUserElectricityBills] = useState({});

  useEffect(() => {
    dispatch(fetchPayments());
    if (isPaymentEnabled) {
      dispatch(fetchStatistics());
    }
    if (customers.length === 0) dispatch(fetchAllCustomers());
    if (tariffs.length === 0) dispatch(fetchRoomsData());
  }, [dispatch, isPaymentEnabled]);

  // Fetch electricity bills for all users when payments are loaded
  useEffect(() => {
    if (payments.length > 0) {
      const fetchBillsForUsers = async () => {
        const billsMap = {};
        const uniqueUserIds = [...new Set(payments.map((p) => p.user_id).filter(Boolean))];

        for (const userId of uniqueUserIds) {
          try {
            const result = await dispatch(fetchUserBills(userId));
            if (result.payload && !result.error) {
              billsMap[userId] = result.payload;
            }
          } catch (error) {
            console.error(`Error fetching bills for user ${userId}:`, error);
          }
        }
        setUserElectricityBills(billsMap);
      };

      fetchBillsForUsers();
    }
  }, [payments, dispatch]);

  const openModal = (type, data = null) => setModalState({ type, data });
  const closeModal = () => setModalState({ type: null, data: null });

  const handleCreateSubmit = (values) => {
    const payload = {
      ...values,
      due_date: dayjs(values.due_date).format("YYYY-MM-DD"),
      payment_cycle_start_date: dayjs(values.payment_cycle_start_date).format("YYYY-MM-DD"),
    };
    dispatch(createNewPayment(payload)).then((res) => {
      if (!res.error) closeModal();
    });
  };

  const handleProcessSubmit = (payload) => {
    dispatch(processPayment(payload)).then((res) => {
      if (!res.error) closeModal();
    });
  };

  const handleConfirmDelete = () => {
    if (modalState.data?.payment_id) {
      dispatch(removePayment(modalState.data.payment_id)).then((res) => {
        if (!res.error) closeModal();
      });
    }
  };

  const handleGeneratePayments = () => {
    dispatch(generatePayments());
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const searchTerm = filters.search.toLowerCase();
      const searchMatch = !searchTerm || p.email?.toLowerCase().includes(searchTerm) || p.name?.toLowerCase().includes(searchTerm) || p.payment_id.toString().includes(searchTerm);

      const statusMatch = filters.status === "all" || p.status === filters.status;
      const dateMatch = filters.dateRange.length === 0 || dayjs(p.due_date).isBetween(filters.dateRange[0], filters.dateRange[1], null, "[]");

      return searchMatch && statusMatch && dateMatch;
    });
  }, [payments, filters]);

  const statCards = [
    { title: "Total Collected", value: `₹${Number(stats.total_collected || 0).toLocaleString()}`, icon: BadgeIndianRupee, color: "green" },
    { title: "Total Outstanding", value: `₹${Number(stats.total_outstanding || 0).toLocaleString()}`, icon: AlarmClock, color: "orange" },
    { title: "Due Payments", value: stats.due_payments || 0, icon: CalendarDays, color: "blue" },
    { title: "Overdue Payments", value: stats.overdue_payments || 0, icon: AlertTriangle, color: "red" },
  ];

  const isLoading = status === "loading";
  const isActionLoading = status === "loading_action";

  return (
    <Card bordered={false}>
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Title level={4} className="pt-0 md:text-left text-center">
            Payment Management
          </Title>
        </Col>
        <Col xs={24} sm={12} className="md:text-right text-center">
          <Space wrap>
            <Tooltip title="Manually trigger monthly payment generation for all active users">
              <Button icon={<SyncOutlined spin={isActionLoading} />} onClick={handleGeneratePayments} disabled={isActionLoading}>
                Generate Payments
              </Button>
            </Tooltip>
            <Tooltip title="Create a manual payment for a specific customer (override system-generated amounts)">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("create")}>
                Add Manual Payment
              </Button>
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {isPaymentEnabled && (
        <div className="grid grid-cols-1 mb-5 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((item) => (
            <div key={item.title} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <p className={`text-2xl font-bold text-${item.color}-600`}>{item.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${item.color}-100`}>
                  <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={8}>
          <Input.Search placeholder="Search by email and name" onSearch={(val) => setFilters((f) => ({ ...f, search: val }))} allowClear style={{ width: "100%" }} />
        </Col>
        <Col xs={24} md={16}>
          <Row gutter={[8, 8]} justify="end">
            <Col xs={24} sm={12} md={8}>
              <Select style={{ width: "100%" }} placeholder="Filter by status" defaultValue="all" onChange={(val) => setFilters((f) => ({ ...f, status: val }))}>
                <Option value="all">All Status</Option>
                <Option value="paid">Paid</Option>
                <Option value="due">Due</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={16}>
              <DatePicker.RangePicker onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates || [] }))} style={{ width: "100%" }} />
            </Col>
          </Row>
        </Col>
      </Row>

      <PaymentTable
        payments={filteredPayments}
        loading={isLoading && payments.length === 0}
        onView={(record) => openModal("view", record)}
        onProcess={(record) => openModal("process", record)}
        onDelete={(record) => openModal("delete", record)}
        onCreateManual={(record) => openModal("create", record)}
        tariffs={tariffs}
        userElectricityBills={userElectricityBills}
        onEBMarkedAsPaid={() => {
          // Refresh payments, statistics, and user electricity bills
          dispatch(fetchPayments());
          if (isPaymentEnabled) {
            dispatch(fetchStatistics());
          }
          // Re-fetch electricity bills for all users
          const fetchBillsForUsers = async () => {
            const billsMap = {};
            const uniqueUserIds = [...new Set(payments.map((p) => p.user_id).filter(Boolean))];
            for (const userId of uniqueUserIds) {
              try {
                const result = await dispatch(fetchUserBills(userId));
                if (result.payload && !result.error) {
                  billsMap[userId] = result.payload;
                }
              } catch (error) {
                console.error(`Error fetching bills for user ${userId}:`, error);
              }
            }
            setUserElectricityBills(billsMap);
          };
          fetchBillsForUsers();
        }}
      />

      <CreatePaymentModal
        visible={modalState.type === "create"}
        onCancel={closeModal}
        onSubmit={handleCreateSubmit}
        loading={isActionLoading}
        customers={customers.filter((c) => c.status === "Active")}
        tariffs={tariffs}
        initialValues={
          modalState.data
            ? {
                user_id: modalState.data.user_id,
                tariff_id: modalState.data.tariff_id,
                amount_due: Number(modalState.data.balance_payable_amount ?? modalState.data.stored_amount_due ?? modalState.data.amount_due ?? 0),
                payment_cycle_start_date: modalState.data.payment_cycle_start_date,
                due_date: modalState.data.due_date,
              }
            : undefined
        }
      />

      <ProcessPaymentModal visible={modalState.type === "process"} onCancel={closeModal} onSubmit={handleProcessSubmit} loading={isActionLoading} payment={modalState.data} />

      <PaymentDetailsModal visible={modalState.type === "view"} onCancel={closeModal} payment={modalState.data} />

      <DeleteConfirmModal
        visible={modalState.type === "delete"}
        onCancel={closeModal}
        onConfirm={handleConfirmDelete}
        title="Confirm Payment Deletion"
        content="Are you sure you want to delete this payment record? This action cannot be undone."
      />
    </Card>
  );
};

export default PaymentManagementPage;
