import React from 'react';
import { Table, Tag, Button } from 'antd';

const BillsTable = ({ bills = [], loading, onView }) => {
  const columns = [
    { title: 'Block', dataIndex: 'block_name', key: 'block_name' },
    { title: 'Room', dataIndex: 'room_number', key: 'room_number' },
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => `₹${Number(v).toFixed(2)}` },
    {
      title: 'Shares', key: 'shares', render: (_, r) => (
        <>
          <Tag color="blue">Total: {r.total_users || 0}</Tag>
          <Tag color="green">Paid: {r.paid_users || 0}</Tag>
          <Tag color="red">Unpaid: {r.unpaid_users || 0}</Tag>
        </>
      )
    },
    {
      title: 'Actions', key: 'actions', render: (_, r) => (
        <Button size="small" onClick={() => onView?.(r)}>View</Button>
      )
    }
  ];

  return (
    <Table rowKey={(r) => r.id} dataSource={bills} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
  );
};

export default BillsTable;


