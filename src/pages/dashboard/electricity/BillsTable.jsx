import React from 'react';
import { Table, Tag, Button, Space, Alert } from 'antd';
import { EditOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';

const BillsTable = ({ bills = [], loading, onView, onEdit, onFinalizeAll }) => {
  const draftBillsCount = bills.filter(bill => bill.status !== 'finalized').length;
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
      title: 'Status', key: 'status', render: (_, r) => (
        <Tag color={r.status === 'finalized' ? 'green' : 'orange'}>
          {r.status || 'draft'}
        </Tag>
      )
    },
    {
      title: 'Actions', key: 'actions', render: (_, r) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView?.(r)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(r)}
            disabled={r.status === 'finalized'}
          >
            Edit
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      {draftBillsCount > 0 && (
        <Alert
          message={`${draftBillsCount} draft bill(s) need finalization`}
          description={
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={onFinalizeAll}
              size="small"
              style={{ marginTop: 8 }}
            >
              Finalize All Draft Bills
            </Button>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Table rowKey={(r) => r.id} dataSource={bills} columns={columns} loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  );
};

export default BillsTable;
