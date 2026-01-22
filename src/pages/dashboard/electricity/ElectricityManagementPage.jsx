import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Typography, Button, Space, Row, Col, Tabs } from "antd";
import BillsTable from "./BillsTable";
import CreateBillModal from "./components/CreateBillModal";
import BillDetailsModal from "./components/BillDetailsModal";
import EditBillModal from "./components/EditBillModal";
import StatisticsPanel from "./components/StatisticsPanel";
import UnpaidSharesTable from "./UnpaidSharesTable";
import DraftBillsTable from "./components/DraftBillsTable";
import FinalizedBillsTable from "./components/FinalizedBillsTable";
import BillSharesManager from "./components/BillSharesManager";
import EditHistoryTable from "./components/EditHistoryTable";
import EditStatisticsPanel from "./components/EditStatisticsPanel";
import {
  fetchBills,
  fetchStatistics,
  fetchUnpaidShares,
  fetchDraftBills,
  fetchFinalizedBills,
  fetchAllEditHistory,
  fetchEditStatistics,
  finalizeAllDraftBills,
  selectBills,
  selectStatistics,
  selectElectricityStatus,
  selectDraftBills,
  selectFinalizedBills,
  selectEditHistory,
  selectEditStatistics
} from "../../../redux/electricity/electricitySlice";

const { Title } = Typography;

const ElectricityManagementPage = () => {
  const dispatch = useDispatch();
  const bills = useSelector(selectBills);
  const statistics = useSelector(selectStatistics);
  const status = useSelector(selectElectricityStatus);

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [refreshTick, setRefreshTick] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    dispatch(fetchUnpaidShares());
  }, [dispatch]);

  const openModal = (type, data = null) => setModalState({ type, data });
  const closeModal = () => setModalState({ type: null, data: null });

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div>
          <StatisticsPanel statistics={statistics} loading={status === "loading" || status === "loading_action"} />

          <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
            <Col span={24}>
              <BillsTable
                bills={bills}
                loading={status === "loading" || status === "loading_action"}
                onView={(record) => openModal("view", record)}
                onEdit={(record) => openModal("edit", record)}
                onFinalizeAll={() => dispatch(finalizeAllDraftBills())}
              />
            </Col>
            <Col span={24}>
              <UnpaidSharesTable key={refreshTick} />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'draft-bills',
      label: 'Draft Bills',
      children: <DraftBillsTable />,
    },
    {
      key: 'finalized-bills',
      label: 'Finalized Bills',
      children: <FinalizedBillsTable />,
    },
    {
      key: 'share-management',
      label: 'Share Management',
      children: <BillSharesManager />,
    },
    {
      key: 'edit-history',
      label: 'Edit History',
      children: <EditHistoryTable />,
    },
    {
      key: 'statistics',
      label: 'Statistics',
      children: <EditStatisticsPanel />,
    },
  ];

  return (
    <Card bordered={false}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} className="pt-0 m-0">
            Electricity Management
          </Title>
        </Col>
        <Col>
          <Button type="primary" onClick={() => openModal("create")}>
            Create Bill
          </Button>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <CreateBillModal
        visible={modalState.type === "create"}
        onCancel={closeModal}
        onCreated={() => {
          // Force UnpaidSharesTable remount and also refresh bill list & stats
          setRefreshTick((v) => v + 1);
          dispatch(fetchBills());
          dispatch(fetchStatistics());
          dispatch(fetchUnpaidShares());
        }}
      />
      <BillDetailsModal visible={modalState.type === "view"} onCancel={closeModal} bill={modalState.data} />
      <EditBillModal
        visible={modalState.type === "edit"}
        onCancel={closeModal}
        bill={modalState.data}
        onEdited={() => {
          // Refresh bill list and stats after editing
          dispatch(fetchBills());
          dispatch(fetchStatistics());
          dispatch(fetchUnpaidShares());
        }}
        onSwitchToShareManagement={() => setActiveTab('share-management')}
      />
    </Card>
  );
};

export default ElectricityManagementPage;
