import React, { useState, useMemo } from 'react';
import { Table, Button, Tag, Dropdown, Menu } from 'antd';
import { EyeOutlined, CheckCircleOutlined, EllipsisOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const PaymentTable = ({ payments, loading, onProcess, onView, onDelete, tariffs = [], userElectricityBills = {} }) => {

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const handleTableChange = (paginationInfo) => {
    setPagination(paginationInfo);
  };


  const getMenuItems = (record) => {
    const { calculatedStatus } = getChargeBreakdown(record);
    return (
      <Menu>
        <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => onView(record)}>
          View Details
        </Menu.Item>
        {calculatedStatus === 'due' && (
          <Menu.Item key="process" icon={<CheckCircleOutlined />} onClick={() => onProcess(record)}>
            Process Payment
          </Menu.Item>
        )}
        <Menu.Divider />
        {/* <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => onDelete(record)}>
          Delete Record
        </Menu.Item> */}
      </Menu>
    );
  };

  const tariffLookup = useMemo(() => {
    return tariffs.reduce((acc, tariff) => {
      acc[tariff.tariff_id] = tariff;
      return acc;
    }, {});
  }, [tariffs]);

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

  const getUnpaidElectricityAmount = (userId) => {
    const bills = userElectricityBills[userId] || [];
    if (!bills || bills.length === 0) {
      return 0;
    }
    // Calculate total unpaid electricity bill amount
    const unpaid = bills
      .filter(b => !b.paid)
      .reduce((sum, bill) => sum + parseFloat(bill.share_amount || 0), 0);
    return unpaid;
  };

  const getPaidElectricityAmount = (userId) => {
    const bills = userElectricityBills[userId] || [];
    if (!bills || bills.length === 0) {
      return 0;
    }
    // Calculate total paid electricity bill amount
    const paid = bills
      .filter(b => b.paid)
      .reduce((sum, bill) => sum + parseFloat(bill.share_amount || 0), 0);
    return paid;
  };

  const getTotalElectricityAmount = (userId) => {
    const bills = userElectricityBills[userId] || [];
    if (!bills || bills.length === 0) {
      return 0;
    }
    // Calculate total electricity bill amount (paid + unpaid)
    const total = bills.reduce((sum, bill) => sum + parseFloat(bill.share_amount || 0), 0);
    return total;
  };

  const isAllEBPaid = (userId) => {
    const bills = userElectricityBills[userId] || [];
    if (!bills || bills.length === 0) {
      return true; // No bills means nothing to pay
    }
    // Check if all bills are paid
    return bills.every(b => b.paid);
  };

  const getChargeBreakdown = (record) => {
    const tariff = tariffLookup[record.tariff_id] || {};
    const rentBase = Number(tariff.fixed_fee ?? 0);
    // For rent, use tariff fixed_fee if available, otherwise try to get from record
    const rent = rentBase > 0 ? rentBase : (record.rent || Number(record.amount_due ?? 0));
    
    // Get electricity amounts
    const unpaidEBAmount = getUnpaidElectricityAmount(record.user_id);
    const paidEBAmount = getPaidElectricityAmount(record.user_id);
    const totalEBAmount = getTotalElectricityAmount(record.user_id);
    
    // For display: show unpaid EB if available, otherwise total EB, otherwise fallback
    const ebDueFromApi = record.eb_due_amount !== undefined ? Number(record.eb_due_amount || 0) : undefined;
    const ebDisplay = unpaidEBAmount > 0 ? unpaidEBAmount : (totalEBAmount > 0 ? totalEBAmount : (ebDueFromApi !== undefined ? ebDueFromApi : Number(tariff.variable_fee || 0)));
    
    // For total calculation: use total EB amount (paid + unpaid), or fallback
    const ebTotal = totalEBAmount > 0 ? totalEBAmount : (ebDueFromApi !== undefined ? ebDueFromApi : Number(tariff.variable_fee || 0));
    
    const total = rent + ebTotal;
    
    // Calculate paid amounts: rent paid + EB paid
    const rentPaid = record.status === 'paid' ? Number(record.amount_due || 0) : 0;
    const totalPaid = rentPaid + paidEBAmount;
    
    // Calculate remaining: total - paid
    const remaining = Math.max(total - totalPaid, 0);
    
    // Status should be "paid" only when remaining is 0 or less
    const calculatedStatus = remaining <= 0 ? 'paid' : 'due';
    
    return { rent, eb: ebDisplay, ebTotal, total, paid: totalPaid, remaining, calculatedStatus, rentPaid, paidEBAmount };
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'email',
      key: 'customer',
      render: (email, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{email}</div>
        </div>
      ),
    },
    {
      title: 'Rent',
      key: 'rent',
      render: (_, record) => {
        const { rent } = getChargeBreakdown(record);
        return <span>{formatCurrency(rent)}</span>;
      },
    },
    {
      title: 'EB Bill',
      key: 'eb',
      render: (_, record) => {
        const unpaidEBAmount = getUnpaidElectricityAmount(record.user_id);
        const totalEBAmount = getTotalElectricityAmount(record.user_id);
        const allEBPaid = isAllEBPaid(record.user_id);
        
        // Show unpaid EB amount, or total EB if no unpaid (all paid)
        const ebAmount = unpaidEBAmount > 0 ? unpaidEBAmount : (totalEBAmount > 0 ? totalEBAmount : 0);
        const hasEBAmount = ebAmount > 0;
        const isPaid = allEBPaid && totalEBAmount > 0;
        
        return (
          <span style={{
            fontWeight: hasEBAmount ? 'bold' : 'normal',
            color: isPaid ? '#52c41a' : (hasEBAmount ? '#ff4d4f' : 'inherit'),
            backgroundColor: isPaid ? '#f6ffed' : (hasEBAmount ? '#fff1f0' : 'transparent'),
            padding: hasEBAmount ? '2px 6px' : '0',
            borderRadius: hasEBAmount ? '4px' : '0',
          }}>
            {formatCurrency(ebAmount)}
          </span>
        );
      },
    },
    {
      title: 'Total Amount',
      key: 'total',
      render: (_, record) => {
        const { total } = getChargeBreakdown(record);
        return <span style={{ fontWeight: 'bold' }}>{formatCurrency(total)}</span>;
      },
      sorter: (a, b) => {
        const totalA = getChargeBreakdown(a);
        const totalB = getChargeBreakdown(b);
        return totalA.total - totalB.total;
      },
    },
    {
      title: 'Paid Amount',
      key: 'paidAmount',
      render: (_, record) => {
        const { paid } = getChargeBreakdown(record);
        return <span>{formatCurrency(paid)}</span>;
      },
    },
    {
      title: 'Remaining Amount',
      key: 'remainingAmount',
      render: (_, record) => {
        const { remaining } = getChargeBreakdown(record);
        return (
          <Tag color={remaining > 0 ? 'error' : 'success'} style={{ margin: 0 }}>
            {formatCurrency(remaining)}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const { calculatedStatus } = getChargeBreakdown(record);
        // Use calculated status if remaining is 0, otherwise use record status
        const displayStatus = calculatedStatus;
        let color = displayStatus === 'paid' ? 'success' : 'error';
        return <Tag color={color}>{displayStatus.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Paid', value: 'paid' },
        { text: 'Due', value: 'due' },
      ],
      onFilter: (value, record) => {
        const { calculatedStatus } = getChargeBreakdown(record);
        return calculatedStatus === value;
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => dayjs(date).format('DD MMM, YYYY'),
      sorter: (a, b) => dayjs(a.due_date).unix() - dayjs(b.due_date).unix(),
    },
    {
      title: 'Last Paid',
      dataIndex: 'payment_date',
      key: 'payment_date',
      render: (date) =>
        date ? dayjs(date).format('DD MMM, YYYY') : <Tag color="default">Not Paid</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Dropdown overlay={getMenuItems(record)} trigger={['click']}>
          <Button type="text" shape="circle" icon={<EllipsisOutlined style={{ fontSize: '20px' }} />} />
        </Dropdown>
      ),
    },
  ];
  return (
    <Table
      columns={columns}
      dataSource={payments}
      loading={loading}
      rowKey="payment_id"
      pagination={{
        ...pagination,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
      }}
      scroll={{ x: 'max-content' }}
      onChange={handleTableChange}
    />
  );
};

export default PaymentTable;