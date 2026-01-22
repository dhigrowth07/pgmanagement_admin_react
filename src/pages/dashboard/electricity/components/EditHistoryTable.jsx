import React, { useEffect, useState } from 'react';
import { Table, Select, Button, Space, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllEditHistory,
  selectEditHistory,
  selectElectricityStatus
} from '../../../../redux/electricity/electricitySlice';

const { Option } = Select;

const EditHistoryTable = () => {
  const dispatch = useDispatch();
  const editHistory = useSelector(selectEditHistory);
  const status = useSelector(selectElectricityStatus);

  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    dispatch(fetchAllEditHistory({ limit, offset }));
  }, [dispatch, limit, offset]);

  const handleRefresh = () => {
    dispatch(fetchAllEditHistory({ limit, offset }));
  };

  const handleLimitChange = (value) => {
    setLimit(value);
    setOffset(0); // Reset to first page when limit changes
  };

  const getActionColor = (actionType) => {
    switch (actionType?.toLowerCase()) {
      case 'create': return 'green';
      case 'update': return 'blue';
      case 'delete': return 'red';
      case 'finalize': return 'purple';
      case 'unfinalize': return 'orange';
      default: return 'default';
    }
  };

  const getEntityColor = (entityType) => {
    switch (entityType?.toLowerCase()) {
      case 'bill': return 'cyan';
      case 'share': return 'geekblue';
      default: return 'default';
    }
  };

  const formatValue = (value, fieldName) => {
    if (value === null || value === undefined) return '-';

    // Handle boolean fields
    if (fieldName === 'paid') {
      return value === 'true' || value === true ? 'Paid' : 'Unpaid';
    }

    // Handle other boolean fields that might be added later
    if (value === 'true') return 'Yes';
    if (value === 'false') return 'No';

    // Return string representation for other values
    return String(value);
  };

  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'edited_at',
      key: 'edited_at',
      render: (date) => date ? new Date(date).toLocaleString() : 'N/A',
      width: 160
    },
    {
      title: 'Action',
      dataIndex: 'action_type',
      key: 'action_type',
      render: (action) => <Tag color={getActionColor(action)}>{action}</Tag>,
      width: 100
    },
    {
      title: 'Entity',
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (entity) => <Tag color={getEntityColor(entity)}>{entity}</Tag>,
      width: 80
    },
    {
      title: 'Field',
      dataIndex: 'field_name',
      key: 'field_name',
      render: (field) => field || '-',
      width: 100
    },
    {
      title: 'Old Value',
      dataIndex: 'old_value',
      key: 'old_value',
      render: (value, record) => formatValue(value, record.field_name),
      ellipsis: true,
      width: 120
    },
    {
      title: 'New Value',
      dataIndex: 'new_value',
      key: 'new_value',
      render: (value, record) => formatValue(value, record.field_name),
      ellipsis: true,
      width: 120
    },
    {
      title: 'User',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (name, record) => name || record.user_email || 'System',
      width: 120
    },
    {
      title: 'Bill Info',
      key: 'bill_info',
      render: (_, record) => (
        <div>
          <div>{record.room_number} - {record.month}</div>
          <div className="text-xs text-gray-500">{record.block_name}</div>
        </div>
      ),
      width: 120
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => notes || '-',
      ellipsis: true,
      width: 150
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold m-0">Edit History</h3>
        <Space>
          <Select value={limit} onChange={handleLimitChange} style={{ width: 80 }}>
            <Option value={25}>25</Option>
            <Option value={50}>50</Option>
            <Option value={100}>100</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={status === 'loading'}
            size="small"
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Table
        rowKey={(r) => r.id}
        dataSource={editHistory}
        columns={columns}
        loading={status === 'loading'}
        pagination={{
          pageSize: limit,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`,
          onChange: (page) => {
            setOffset((page - 1) * limit);
          }
        }}
        size="small"
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default EditHistoryTable;
