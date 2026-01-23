import React, { useEffect } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFinalizedBills,
  unfinalizeBill,
  selectFinalizedBills,
  selectElectricityStatus
} from '../../../../redux/electricity/electricitySlice';

const FinalizedBillsTable = () => {
  const dispatch = useDispatch();
  const finalizedBills = useSelector(selectFinalizedBills);
  const status = useSelector(selectElectricityStatus);

  useEffect(() => {
    dispatch(fetchFinalizedBills());
  }, [dispatch]);

  const handleUnfinalize = (billId) => {
    dispatch(unfinalizeBill(billId));
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
        <Space>
          <Tag color="blue">Total: {record.total_shares || 0}</Tag>
          <Tag color="green">Paid: {record.paid_shares || 0}</Tag>
        </Space>
      ),
      width: 200
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="green">Finalized</Tag>,
      responsive: ['sm'], // Hide on extra small screens
      width: 120
    },
    {
      title: 'Finalized',
      dataIndex: 'finalized_at',
      key: 'finalized_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      responsive: ['lg'], // Hide on screens < 1024px
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right', // Stick to right on scroll
      width: 50,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            danger
            onClick={() => handleUnfinalize(record.id)}
            loading={status === 'loading_action'}
          >
            Unfinalize
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <h3 className="font-semibold mb-4">Finalized Bills</h3>
      <Table
        rowKey={(r) => r.id}
        dataSource={finalizedBills}
        columns={columns}
        loading={status === 'loading'}
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 1000 }} // Enable horizontal scroll on mobile
      />
    </div>
  );
};

export default FinalizedBillsTable;
