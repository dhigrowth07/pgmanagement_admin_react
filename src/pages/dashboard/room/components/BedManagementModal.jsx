import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Space, Tag, Tooltip, Popconfirm, Typography, Divider } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ToolOutlined, CheckCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchBedsByRoom, 
  addBed, 
  updateBed, 
  deleteBed, 
  changeBedStatus, 
  selectRoomBeds, 
  selectBedStatus,
  clearRoomBeds
} from "../../../../redux/bed/bedSlice";
import BedFormModal from "./BedFormModal";

const { Text, Title } = Typography;

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onCancel
 * @param {any} props.room
 */
const BedManagementModal = ({ visible, onCancel, room }) => {
  const dispatch = useDispatch();
  const beds = useSelector(selectRoomBeds);
  const loadingStatus = useSelector(selectBedStatus);
  const isLoading = loadingStatus === "loading";

  /** @type {[{visible: boolean, bed: any}, Function]} */
  const [formModal, setFormModal] = useState({ visible: false, bed: null });

  useEffect(() => {
    if (visible && room?.room_id) {
      dispatch(fetchBedsByRoom(room.room_id));
    } else if (!visible) {
      dispatch(clearRoomBeds());
    }
  }, [visible, room, dispatch]);

  const handleAddBed = () => {
    // Check if current bed count has reached room capacity
    const currentBedCount = beds?.length || 0;
    const roomCapacity = room?.capacity || 0;
    
    if (currentBedCount >= roomCapacity) {
      Modal.warning({
        title: "Capacity Reached",
        content: `Cannot add more beds. Room capacity is ${roomCapacity} and you already have ${currentBedCount} bed(s).`,
      });
      return;
    }
    
    setFormModal({ visible: true, bed: null });
  };

  /** @param {any} bed */
  const handleEditBed = (bed) => {
    setFormModal({ visible: true, bed });
  };

  /** @param {any} values */
  const handleFormSubmit = (values) => {
    if (formModal.bed) {
      dispatch(updateBed({ id: formModal.bed.bed_id, data: values, roomId: room.room_id }));
    } else {
      dispatch(addBed({ ...values, room_id: room.room_id }));
    }
    setFormModal({ visible: false, bed: null });
  };

  /** @param {string} bedId */
  const handleDeleteBed = (bedId) => {
    dispatch(deleteBed({ id: bedId, roomId: room.room_id }));
  };

  /** @param {string} bedId @param {string} newStatus */
  const handleStatusChange = (bedId, newStatus) => {
    dispatch(changeBedStatus({ id: bedId, statusData: { bed_status: newStatus }, roomId: room.room_id }));
  };

  /** @param {string} status */
  const getStatusTag = (status) => {
    switch (status) {
      case "AVAILABLE":
        return <Tag color="success" icon={<CheckCircleOutlined />}>Available</Tag>;
      case "OCCUPIED":
        return <Tag color="blue" icon={<UserOutlined />}>Occupied</Tag>;
      case "MAINTENANCE":
        return <Tag color="warning" icon={<ToolOutlined />}>Maintenance</Tag>;
      case "RESERVED":
        return <Tag color="purple">Reserved</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: "Bed Code",
      dataIndex: "bed_code",
      key: "bed_code",
      render: (/** @type {string} */ text) => <Text strong>{text}</Text>,
    },
    {
      title: "Status",
      dataIndex: "bed_status",
      key: "bed_status",
      render: (/** @type {string} */ status) => getStatusTag(status),
    },
    {
      title: "Assigned To",
      dataIndex: "user_name",
      key: "user_name",
      render: (/** @type {string} */ name) => name || <Text type="secondary">None</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (/** @type {any} */ _, /** @type {any} */ record) => (
        <Space size="middle">
          <Tooltip title="Edit Bed">
            <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEditBed(record)} 
                disabled={record.bed_status === 'OCCUPIED'}
            />
          </Tooltip>

          {record.bed_status !== "OCCUPIED" && (
            <Tooltip title={record.bed_status === "MAINTENANCE" ? "Mark as Available" : "Mark for Maintenance"}>
                <Button 
                    type="text" 
                    icon={record.bed_status === "MAINTENANCE" ? <CheckCircleOutlined /> : <ToolOutlined />} 
                    onClick={() => handleStatusChange(record.bed_id, record.bed_status === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE")}
                />
            </Tooltip>
          )}

          <Popconfirm
            title="Delete Bed"
            description="Are you sure you want to delete this bed? This cannot be undone."
            onConfirm={() => handleDeleteBed(record.bed_id)}
            okText="Yes"
            cancelText="No"
            disabled={record.bed_status === "OCCUPIED"}
          >
            <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                disabled={record.bed_status === "OCCUPIED"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const currentBedCount = beds?.length || 0;
  const roomCapacity = room?.capacity || 0;
  const isAtCapacity = currentBedCount >= roomCapacity;

  return (
    <>
      <Modal
        title={
          <div className="flex justify-between items-center pr-10">
            <span>Manage Beds - Room {room?.room_number}</span>
            {!isAtCapacity && (
              <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleAddBed}
                  size="small"
              >
                Add Bed
              </Button>
            )}
          </div>
        }
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
        centered
      >
        <Divider style={{ margin: "12px 0" }} />
        
        <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
                Room Capacity: <strong>{room?.capacity}</strong> | 
                Current Beds: <strong>{beds.length}</strong> | 
                Occupied: <strong>{beds.filter((/** @type {any} */ b) => b.bed_status === 'OCCUPIED').length}</strong>
            </Text>
        </div>

        <Table
          rowKey="bed_id"
          columns={columns}
          dataSource={beds}
          loading={isLoading}
          pagination={false}
          scroll={{ y: 400 }}
          locale={{ emptyText: "No beds added to this room yet." }}
        />

        <div className="mt-4 flex justify-end">
            <Button onClick={onCancel}>Close</Button>
        </div>
      </Modal>

      <BedFormModal
        visible={formModal.visible}
        onCancel={() => setFormModal({ visible: false, bed: null })}
        onSubmit={handleFormSubmit}
        bed={formModal.bed}
        loading={isLoading}
        roomId={room?.room_id}
      />
    </>
  );
};

export default BedManagementModal;
