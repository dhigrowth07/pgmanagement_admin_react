import React, { useEffect } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDraftBills,
  finalizeBill,
  selectDraftBills,
  selectElectricityStatus
} from '../../../../redux/electricity/electricitySlice';

const DraftBillsTable = () => {
  const dispatch = useDispatch();
  const draftBills = useSelector(selectDraftBills);
  const status = useSelector(selectElectricityStatus);

  useEffect(() => {
    dispatch(fetchDraftBills());
  }, [dispatch]);

  const handleFinalize = (billId) => {
    dispatch(finalizeBill(billId));
  };

  const columns = [
    { 
      title: 'Block', 
      dataIndex: 'block_name', 
      key: 'block_name',
      responsive: ['md'], // Hide on mobile (screens < 768px)
      width: 150
    },
    { 
      title: 'Room', 
      dataIndex: 'room_number', 
      key: 'room_number',
      width: 100
    },
    { 
      title: 'Month', 
      dataIndex: 'month', 
      key: 'month',
      width: 120
    },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount', 
      render: (v) => `₹${Number(v).toFixed(2)}`,
      width: 120
    },
    {
      title: 'Shares',
      key: 'shares',
      render: (_, record) => (
        <Tag color="blue">{record.total_shares || 0} users</Tag>
      ),
      responsive: ['sm'], // Hide on extra small screens
      width: 120
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="orange">Draft</Tag>,
      responsive: ['sm'], // Hide on extra small screens
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right', // Stick to right on scroll
      width: 40,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            onClick={() => handleFinalize(record.id)}
            loading={status === 'loading_action'}
          >
            Finalize
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <h3 className="font-semibold mb-4">Draft Bills</h3>
      <Table
        rowKey={(r) => r.id}
        dataSource={draftBills}
        columns={columns}
        loading={status === 'loading'}
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 800 }} // Enable horizontal scroll on mobile
      />
    </div>
  );
};

export default DraftBillsTable;
