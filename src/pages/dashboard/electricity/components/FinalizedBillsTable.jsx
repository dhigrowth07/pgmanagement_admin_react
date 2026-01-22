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
    { title: 'Block', dataIndex: 'block_name', key: 'block_name' },
    { title: 'Room', dataIndex: 'room_number', key: 'room_number' },
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => `₹${Number(v).toFixed(2)}` },
    {
      title: 'Shares',
      key: 'shares',
      render: (_, record) => (
        <Space>
          <Tag color="blue">Total: {record.total_shares || 0}</Tag>
          <Tag color="green">Paid: {record.paid_shares || 0}</Tag>
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="green">Finalized</Tag>
    },
    {
      title: 'Finalized',
      dataIndex: 'finalized_at',
      key: 'finalized_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
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
      />
    </div>
  );
};

export default FinalizedBillsTable;
