import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Tag } from 'antd';
import { fetchUserBills, selectUserBills, selectElectricityStatus } from '../../../../redux/electricity/electricitySlice';
import { selectUser } from '../../../../redux/auth/authSlice';

const MyElectricityBills = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const bills = useSelector(selectUserBills);
  const status = useSelector(selectElectricityStatus);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(fetchUserBills(user.user_id));
    }
  }, [dispatch, user?.user_id]);

  const columns = [
    { title: 'Month', dataIndex: 'month', key: 'month' },
    { title: 'Block', dataIndex: 'block_name', key: 'block_name' },
    { title: 'Room', dataIndex: 'room_number', key: 'room_number' },
    { title: 'Total Amount', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `₹${Number(v).toFixed(2)}` },
    { title: 'Your Share', dataIndex: 'share_amount', key: 'share_amount', render: (v) => `₹${Number(v).toFixed(2)}` },
    { title: 'Status', dataIndex: 'paid', key: 'paid', render: (v) => v ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag> },
  ];

  return (
    <Card title="My Electricity Bills" bordered={false}>
      <Table rowKey={(r) => r.share_id} dataSource={bills} columns={columns} loading={status === 'loading' || status === 'loading_action'} />
    </Card>
  );
};

export default MyElectricityBills;


