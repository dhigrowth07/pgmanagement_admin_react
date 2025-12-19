import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table } from 'antd';
import { fetchUserPaymentHistory, selectUserHistory, selectElectricityStatus } from '../../../../redux/electricity/electricitySlice';
import { selectUser } from '../../../../redux/auth/authSlice';

const PaymentHistory = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const userHistory = useSelector(selectUserHistory);
  const status = useSelector(selectElectricityStatus);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(fetchUserPaymentHistory(user.user_id));
    }
  }, [dispatch, user?.user_id]);

  const columns = [
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Block', dataIndex: 'block_name', key: 'block_name' },
    { title: 'Room', dataIndex: 'room_number', key: 'room_number' },
    { title: 'Paid Amount', dataIndex: 'share_amount', key: 'share_amount', render: (v) => `₹${Number(v).toFixed(2)}` },
    { title: 'Paid At', dataIndex: 'paid_at', key: 'paid_at' },
  ];

  return (
    <Card title={`Payment History (Total Paid: ₹${Number(userHistory?.total_paid || 0).toFixed(2)})`} bordered={false}>
      <Table rowKey={(r) => r.id} dataSource={userHistory?.history || []} columns={columns} loading={status === 'loading' || status === 'loading_action'} />
    </Card>
  );
};

export default PaymentHistory;


