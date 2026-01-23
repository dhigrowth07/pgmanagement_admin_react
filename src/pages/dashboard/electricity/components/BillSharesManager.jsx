import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Table, Space, Modal, Form, Input, InputNumber, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchBills,
  fetchBillShares,
  addUserToBill,
  updateShareManually,
  removeUserFromBill,
  fetchActiveUsers,
  selectBills,
  selectBillShares,
  selectElectricityStatus,
  selectActiveUsers
} from '../../../../redux/electricity/electricitySlice';

const { Option } = Select;

const BillSharesManager = () => {
  const dispatch = useDispatch();
  const bills = useSelector(selectBills);
  const billShares = useSelector(selectBillShares);
  const activeUsers = useSelector(selectActiveUsers);
  const status = useSelector(selectElectricityStatus);

  const [selectedBillId, setSelectedBillId] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedShare, setSelectedShare] = useState(null);
  const [shareToDelete, setShareToDelete] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    dispatch(fetchBills());
    dispatch(fetchActiveUsers());
  }, [dispatch]);



  useEffect(() => {
    if (selectedBillId) {
      dispatch(fetchBillShares(selectedBillId));
    }
  }, [selectedBillId, dispatch]);

  const handleBillChange = (billId) => {
    setSelectedBillId(billId);
  };

  const handleAddUser = () => {
    setIsAddModalVisible(true);
  };

  const handleEditShare = (share) => {
    setSelectedShare(share);
    setIsEditModalVisible(true);
    editForm.setFieldsValue({
      share_amount: share.share_amount,
      notes: share.notes || ''
    });
  };

  const handleDeleteShare = (share) => {
    setShareToDelete(share);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (shareToDelete && selectedBillId) {
      dispatch(removeUserFromBill({ billId: selectedBillId, shareId: shareToDelete.id }));
      setIsDeleteModalVisible(false);
      setShareToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setShareToDelete(null);
  };

  const handleAddSubmit = (values) => {
    dispatch(addUserToBill({ billId: selectedBillId, data: values }))
      .then(() => {
        setIsAddModalVisible(false);
        addForm.resetFields();
      });
  };

  const handleEditSubmit = (values) => {
    dispatch(updateShareManually({ billId: selectedBillId, shareId: selectedShare.id, data: values }))
      .then(() => {
        setIsEditModalVisible(false);
        setSelectedShare(null);
        editForm.resetFields();
      });
  };

  const columns = [
    { 
      title: 'User', 
      dataIndex: 'user_name', 
      key: 'user_name',
      width: 150,
      fixed: 'left' // Keep user visible on scroll
    },
    { 
      title: 'Email', 
      dataIndex: 'user_email', 
      key: 'user_email',
      responsive: ['md'], // Hide on mobile (screens < 768px)
      width: 200
    },
    { 
      title: 'Share Amount', 
      dataIndex: 'share_amount', 
      key: 'share_amount', 
      render: (v) => `₹${Number(v).toFixed(2)}`,
      width: 120
    },
    { 
      title: 'Paid', 
      dataIndex: 'paid', 
      key: 'paid', 
      render: (paid) => paid ? 'Yes' : 'No',
      width: 80
    },
    { 
      title: 'Manual Edit', 
      dataIndex: 'is_manually_edited', 
      key: 'is_manually_edited', 
      render: (edited) => edited ? 'Yes' : 'No',
      responsive: ['lg'], // Hide on screens < 1024px
      width: 100
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right', // Stick to right on scroll
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditShare(record)}
            disabled={record.paid}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteShare(record)}
            disabled={record.paid}
          >
            Remove
          </Button>
        </Space>
      )
    }
  ];

  const selectedBill = bills.find(bill => bill.id === selectedBillId);

  // Filter users: must be active, in the same room as the bill, and not already in bill shares
  const availableUsers = activeUsers.filter(user =>
    user.room_id === selectedBill?.room_id &&
    !billShares.some(share => share.user_id === user.user_id)
  );

  return (
    <div>
      <h3 className="font-semibold mb-4">Manual Share Management</h3>

      <Card size="small" className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center">
          <span className="whitespace-nowrap">Select Bill:</span>
          <Select
            className="w-full sm:flex-1"
            style={{ minWidth: '200px' }}
            placeholder="Choose a bill to manage shares"
            onChange={handleBillChange}
            value={selectedBillId}
          >
            {bills.map(bill => (
              <Option key={bill.id} value={bill.id}>
                {bill.block_name} - {bill.room_number} - {bill.month} - ₹{bill.amount}
              </Option>
            ))}
          </Select>
          {selectedBillId && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddUser}
              size="small"
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Add User
            </Button>
          )}
        </div>
      </Card>

      {selectedBillId && selectedBill && (
        <Card size="small" className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <strong>Room:</strong> {selectedBill.room_number}
            </div>
            <div>
              <strong>Month:</strong> {selectedBill.month}
            </div>
            <div>
              <strong>Total Amount:</strong> ₹{selectedBill.amount}
            </div>
            <div>
              <strong>Status:</strong> {selectedBill.status || 'Draft'}
            </div>
          </div>
        </Card>
      )}

      {selectedBillId && (
        <Table
          key={`bill-shares-${selectedBillId}-${billShares.length}-${billShares.reduce((sum, s) => sum + parseFloat(s.share_amount || 0), 0)}`}
          rowKey={(r) => r.id}
          dataSource={billShares}
          columns={columns}
          loading={status === 'loading' || status === 'loading_action'}
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ x: 800 }} // Enable horizontal scroll on mobile
        />
      )}

      {/* Add User Modal */}
      <Modal
        title="Add User to Bill"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          addForm.resetFields();
        }}
        footer={null}
      >
        <Form form={addForm} onFinish={handleAddSubmit} layout="vertical">
          <Form.Item
            name="user_id"
            label="Select User"
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select
              placeholder="Select an active user"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              loading={status === 'loading' || status === 'loading_action'}
              notFoundContent={availableUsers.length === 0 ? "All active users are already added to this bill" : "No matching users"}
            >
              {availableUsers.map(user => (
                <Option key={user.user_id} value={user.user_id}>
                  {user.name} - {user.email} {user.customer_id ? `(ID: ${user.customer_id})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="share_amount"
            label="Share Amount"
            rules={[{ required: true, message: 'Please enter share amount' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="Enter share amount"
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea placeholder="Optional notes" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={status === 'loading_action'}>
                Add User
              </Button>
              <Button onClick={() => {
                setIsAddModalVisible(false);
                addForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Share Modal */}
      <Modal
        title="Edit Share Amount"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedShare(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form form={editForm} onFinish={handleEditSubmit} layout="vertical">
          <Form.Item
            name="share_amount"
            label="Share Amount"
            rules={[{ required: true, message: 'Please enter share amount' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={status === 'loading_action'}>
                Update Share
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false);
                setSelectedShare(null);
                editForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Remove User from Bill"
        open={isDeleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Remove"
        okType="danger"
        confirmLoading={status === 'loading_action'}
      >
        <p>Are you sure you want to remove <strong>{shareToDelete?.user_name}</strong> from this bill?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default BillSharesManager;
