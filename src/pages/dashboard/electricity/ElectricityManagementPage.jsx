import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Typography, Button, Space, Row, Col } from "antd";
import BillsTable from "./BillsTable";
import CreateBillModal from "./components/CreateBillModal";
import BillDetailsModal from "./components/BillDetailsModal";
import StatisticsPanel from "./components/StatisticsPanel";
import UnpaidSharesTable from "./UnpaidSharesTable";
import { fetchBills, fetchStatistics, fetchUnpaidShares, selectBills, selectStatistics, selectElectricityStatus } from "../../../redux/electricity/electricitySlice";

const { Title } = Typography;

const ElectricityManagementPage = () => {
  const dispatch = useDispatch();
  const bills = useSelector(selectBills);
  const statistics = useSelector(selectStatistics);
  const status = useSelector(selectElectricityStatus);

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    dispatch(fetchBills());
    dispatch(fetchStatistics());
    dispatch(fetchUnpaidShares());
  }, [dispatch]);

  const openModal = (type, data = null) => setModalState({ type, data });
  const closeModal = () => setModalState({ type: null, data: null });

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

      <StatisticsPanel statistics={statistics} loading={status === "loading" || status === "loading_action"} />

      <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
        <Col span={24}>
          <BillsTable bills={bills} loading={status === "loading" || status === "loading_action"} onView={(record) => openModal("view", record)} />
        </Col>
        <Col span={24}>
          <UnpaidSharesTable key={refreshTick} />
        </Col>
      </Row>

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
    </Card>
  );
};

export default ElectricityManagementPage;
