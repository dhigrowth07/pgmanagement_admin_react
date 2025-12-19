import React, { useEffect } from 'react';
import { Modal, Table, Tag } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBillById, selectSelectedBill } from '../../../../redux/electricity/electricitySlice';

const BillDetailsModal = ({ visible, onCancel, bill }) => {
  const dispatch = useDispatch();
  const selected = useSelector(selectSelectedBill);

  useEffect(() => {
    if (visible && bill?.id) {
      dispatch(fetchBillById(bill.id));
    }
  }, [visible, bill?.id, dispatch]);

  const columns = [
    { title: 'User', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Share', dataIndex: 'share_amount', key: 'share_amount', render: (v) => `₹${Number(v).toFixed(2)}` },
    { title: 'Status', dataIndex: 'paid', key: 'paid', render: (v) => v ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag> },
  ];

  return (
    <Modal title={`Bill Details - ${bill?.block_name || ''} ${bill?.room_number || ''} ${bill?.month || ''}`} open={visible} onCancel={onCancel} footer={null} width={800}>
      <Table rowKey={(r) => r.id} dataSource={selected?.shares || []} columns={columns} pagination={{ pageSize: 6 }} />
    </Modal>
  );
};

export default BillDetailsModal;


