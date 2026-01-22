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
    { title: 'Block', dataIndex: 'block_name', key: 'block_name' },
    { title: 'Room', dataIndex: 'room_number', key: 'room_number' },
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => `₹${Number(v).toFixed(2)}` },
    {
      title: 'Shares',
      key: 'shares',
      render: (_, record) => (
        <Tag color="blue">{record.total_shares || 0} users</Tag>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="orange">Draft</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
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
      />
    </div>
  );
};

export default DraftBillsTable;
