import React from 'react';
import { Table, Tag, Button, Space, Alert } from 'antd';
import { EditOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';

const BillsTable = ({ bills = [], loading, onView, onEdit, onFinalizeAll }) => {
  const draftBillsCount = bills.filter(bill => bill.status !== 'finalized').length;
  
  // Mobile responsive column configuration
  const getColumns = () => {
    const baseColumns = [
      {
        title: 'Block',
        dataIndex: 'block_name',
        key: 'block_name'
      },
      {
        title: 'Room',
        dataIndex: 'room_number',
        key: 'room_number'
      },
      {
        title: 'Month',
        dataIndex: 'month',
        key: 'month'
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (v) => `₹${Number(v).toFixed(2)}`
      }
    ];

    const sharesColumn = {
      title: 'Shares',
      key: 'shares',
      render: (_, r) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Tag color="blue" style={{ margin: 0 }}>T: {r.total_users || 0}</Tag>
          <Tag color="green" style={{ margin: 0 }}>P: {r.paid_users || 0}</Tag>
          <Tag color="red" style={{ margin: 0 }}>U: {r.unpaid_users || 0}</Tag>
        </div>
      )
    };

    const statusColumn = {
      title: 'Status',
      key: 'status',
      render: (_, r) => (
        <Tag color={r.status === 'finalized' ? 'green' : 'orange'}>
          {r.status || 'draft'}
        </Tag>
      )
    };

    const actionsColumn = {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView?.(r)}
            style={{ padding: '0 8px' }}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit?.(r)}
            disabled={r.status === 'finalized'}
            style={{ padding: '0 8px' }}
          >
            Edit
          </Button>
        </Space>
      )
    };

    return [...baseColumns, sharesColumn, statusColumn, actionsColumn];
  };
  
  const columns = getColumns();

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      {draftBillsCount > 0 && (
        <Alert
          message={`${draftBillsCount} draft bill(s) need finalization`}
          description={
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={onFinalizeAll}
              size="small"
              style={{ marginTop: 8, padding: '0 12px' }}
            >
              Finalize All
            </Button>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Table
        rowKey={(r) => r.id}
        dataSource={bills}
        columns={columns}
        loading={loading}
        pagination={{ 
          pageSize: 10,
          size: 'small',
          showSizeChanger: false
        }}
        scroll={{ x: true }}
        size="small"
      />
    </div>
  );
};

export default BillsTable;
