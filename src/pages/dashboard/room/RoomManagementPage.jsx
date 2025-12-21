import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Input, Row, Col, Typography, Select, Spin, Table, Space, Modal } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Hotel, UserCheck, DoorOpen } from "lucide-react";
import {
  fetchRoomsData,
  addBlock,
  updateBlock,
  deleteBlock,
  addRoom,
  updateRoom,
  deleteRoom,
  addTariff,
  updateTariff,
  deleteTariff,
  addRoomPreset,
  updateRoomPreset,
  deleteRoomPreset,
  updateBlockGoogleReview,
} from "../../../redux/room/roomSlice";
import RoomsTable from "./RoomsTable";
import BlockFormModal from "./components/BlockFormModal";
import RoomFormModal from "./components/RoomFormModal";
import DeleteConfirmModal from "../../../components/Modals/DeleteConfirmModal";
import TariffFormModal from "./components/TariffFormModal";
import RoomPresetFormModal from "./components/RoomPresetFormModal";
import GoogleReviewModal from "./components/GoogleReviewModal";

const { Title } = Typography;
const { Option } = Select;

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

const ManagementModal = ({ title, columns, data, onAddItem, onEditItem, onDeleteItem, visible, onCancel, loading }) => {
  const enhancedColumns = [
    ...columns,
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => onEditItem(record)}>Edit</a>
          {/* <a onClick={() => onDeleteItem(record)} style={{ color: 'red' }}>Delete</a> */}
        </Space>
      ),
    },
  ];
  return (
    <Modal title={title} open={visible} onCancel={onCancel} footer={null} width={800}>
      <Button onClick={onAddItem} type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
        Add New
      </Button>
      <Table rowKey={columns[0].dataIndex} columns={enhancedColumns} dataSource={data} loading={loading} pagination={{ pageSize: 5 }} scroll={{ x: "max-content" }} />
    </Modal>
  );
};

const RoomManagementPage = () => {
  const dispatch = useDispatch();
  const { rooms, blocks, presets, tariffs, status } = useSelector((state) => state.room);
  const isMobile = useIsMobile();

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [formModal, setFormModal] = useState({ type: null, data: null });
  const [filters, setFilters] = useState({ block: "all", status: "all", search: "" });
  const [managementModal, setManagementModal] = useState(null);
  const [reviewModal, setReviewModal] = useState({ visible: false, block: null });

  useEffect(() => {
    dispatch(fetchRoomsData());
  }, [dispatch]);

  const openModal = (type, data = null) => setModalState({ type, data });
  const closeModal = () => setModalState({ type: null, data: null });

  const openFormModal = (type, data = null) => setFormModal({ type, data });
  const closeFormModal = () => setFormModal({ type: null, data: null });

  const openManagementModal = (type) => setManagementModal(type);
  const closeManagementModal = () => setManagementModal(null);

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const openReviewModal = (block) => setReviewModal({ visible: true, block });
  const closeReviewModal = () => setReviewModal({ visible: false, block: null });

  const handleUpdateReviewLink = (values) => {
    dispatch(updateBlockGoogleReview(values));
    closeReviewModal();
  };

  const handleSubmit = (values) => {
    const activeModal = formModal.type ? formModal : modalState;
    switch (activeModal.type) {
      case "addTariff":
        dispatch(addTariff(values));
        break;
      case "editTariff":
        dispatch(updateTariff({ id: activeModal.data.tariff_id, data: values }));
        break;
      case "addPreset":
        dispatch(addRoomPreset(values));
        break;
      case "editPreset":
        dispatch(updateRoomPreset({ id: activeModal.data.preset_id, data: values }));
        break;
      case "addRoom":
        dispatch(addRoom(values));
        break;
      case "editRoom":
        dispatch(updateRoom({ id: activeModal.data.room_id, data: values }));
        break;
      case "addBlock":
        dispatch(addBlock(values));
        break;
      case "editBlock":
        dispatch(updateBlock({ id: activeModal.data.block_id, data: values }));
        break;
      default:
        break;
    }
    closeFormModal();
    closeModal();
  };

  const handleConfirmDelete = () => {
    const activeModal = formModal.type ? formModal : modalState;
    switch (activeModal.type) {
      case "deleteTariff":
        dispatch(deleteTariff(activeModal.data.tariff_id));
        break;
      case "deletePreset":
        dispatch(deleteRoomPreset(activeModal.data.preset_id));
        break;
      case "deleteRoom":
        dispatch(deleteRoom(activeModal.data.room_id));
        break;
      case "deleteBlock":
        dispatch(deleteBlock(activeModal.data.block_id));
        break;
      default:
        break;
    }
    closeFormModal();
    closeModal();
  };

  const filteredBlocks = useMemo(() => {
    // Get all block IDs that exist
    const existingBlockIds = new Set(blocks.map((block) => block.block_id));

    // Group rooms by existing blocks (only show rooms that belong to existing blocks)
    let blockData = blocks.map((block) => ({
      ...block,
      rooms: rooms.filter((room) => room.block_id === block.block_id),
    }));

    // Find unassigned rooms (rooms with no block_id)
    const unassignedRooms = rooms.filter((room) => !room.block_id);

    // Add unassigned rooms as a separate "block"
    if (unassignedRooms.length > 0) {
      blockData.push({
        block_id: "unassigned",
        block_name: "Unassigned",
        block_manager_id: null,
        address: null,
        google_review_link: null,
        is_active: true,
        created_at: null,
        updated_at: null,
        admin_id: null,
        tenant_id: null,
        rooms: unassignedRooms,
      });
    }

    // Apply filters
    if (filters.search) {
      const term = filters.search.toLowerCase();
      blockData = blockData
        .map((b) => ({
          ...b,
          rooms: b.rooms.filter((r) => r.room_number.toLowerCase().includes(term)),
        }))
        .filter((b) => b.rooms.length > 0 || b.block_name.toLowerCase().includes(term));
    }
    if (filters.block !== "all") {
      blockData = blockData.filter((b) => {
        // Handle special case for unassigned
        if (filters.block === "unassigned") return b.block_id === "unassigned";
        return b.block_id === filters.block;
      });
    }
    if (filters.status !== "all") {
      blockData = blockData
        .map((b) => ({
          ...b,
          rooms: b.rooms.filter((r) => (r.current_occupancy >= r.capacity ? "occupied" : "vacant") === filters.status),
        }))
        .filter((b) => b.rooms.length > 0);
    }
    return blockData;
  }, [rooms, blocks, filters]);

  const stats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.current_occupancy >= r.capacity).length;
    return { totalRooms, occupiedRooms, vacantRooms: totalRooms - occupiedRooms };
  }, [rooms]);

  const roomStats = [
    { label: "Total Rooms", value: stats.totalRooms, icon: Hotel, color: "text-blue-600", bgColor: "bg-blue-100" },
    { label: "Occupied Rooms", value: stats.occupiedRooms, icon: UserCheck, color: "text-green-600", bgColor: "bg-green-100" },
    { label: "Vacant Rooms", value: stats.vacantRooms, icon: DoorOpen, color: "text-orange-600", bgColor: "bg-orange-100" },
  ];

  const tariffColumns = [
    { title: "ID", dataIndex: "tariff_id", key: "tariff_id" },
    { title: "Name", dataIndex: "tariff_name", key: "tariff_name" },
    { title: "Fixed Fee", dataIndex: "fixed_fee", key: "fixed_fee", render: (fee) => `₹${fee}` },
    { title: "Variable Fee", dataIndex: "variable_fee", key: "variable_fee", render: (fee) => `₹${fee}` },
  ];

  const presetColumns = [
    { title: "ID", dataIndex: "preset_id", key: "preset_id" },
    { title: "Name", dataIndex: "preset_name", key: "preset_name" },
    { title: "Sharing Type", dataIndex: "sharing_type", key: "sharing_type" },
    {
      title: "Tariff",
      dataIndex: "tariff_name",
      key: "tariff_name",
      render: (text, record) => `${text} (₹${record.fixed_fee})`,
    },
  ];

  if (status === "loading" && rooms.length === 0)
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );

  return (
    <Card bordered={false}>
      <Row justify="space-between" align="middle" gutter={[0, 0]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Title level={4} className="pt-0 md:text-left text-center">
            Rooms Management
          </Title>
        </Col>
        <Col xs={24} md={16} className="md:text-right text-center">
          <Space wrap={isMobile}>
            <Button onClick={() => openManagementModal("tariff")}>Manage Tariffs</Button>
            <Button onClick={() => openManagementModal("preset")}>Manage Presets</Button>
            <Button onClick={() => openModal("addBlock")} icon={<PlusOutlined />}>
              Add Block
            </Button>
            <Button onClick={() => openModal("addRoom")} type="primary" icon={<PlusOutlined />}>
              Add Room
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Room Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-5">
        {roomStats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Section */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={10}>
          <Input.Search placeholder="Search by room number..." onSearch={(val) => handleFilterChange("search", val)} enterButton={<SearchOutlined />} allowClear style={{ width: "100%" }} />
        </Col>
        <Col xs={24} md={14}>
          <Row gutter={[8, 8]} justify="end">
            <Col xs={24} sm={12} md={8}>
              <Select value={filters.block} onChange={(val) => handleFilterChange("block", val)} style={{ width: "100%" }}>
                <Option value="all">All Blocks</Option>
                 {blocks.map((b) => (
                   <Option key={b.block_id} value={b.block_id}>
                     {b.block_name}
                   </Option>
                 ))}
                 {/* Show unassigned option only if rooms without block_id exist */}
                 {rooms.some((r) => !r.block_id) && <Option value="unassigned">Unassigned</Option>}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select value={filters.status} onChange={(val) => handleFilterChange("status", val)} style={{ width: "100%" }}>
                <Option value="all">All Status</Option>
                <Option value="vacant">Vacant</Option>
                <Option value="occupied">Occupied</Option>
              </Select>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Room Table */}
      <RoomsTable
        blocks={filteredBlocks}
        onEditRoom={(room) => openModal("editRoom", room)}
        onDeleteRoom={(room) => openFormModal("deleteRoom", room)}
        onEditBlock={(block) => openModal("editBlock", block)}
        onDeleteBlock={(block) => openFormModal("deleteBlock", block)}
        onOpenReview={openReviewModal}
      />

      {/* Management Modals */}
      <ManagementModal
        title="Manage Tariffs"
        columns={tariffColumns}
        data={tariffs}
        onAddItem={() => openFormModal("addTariff")}
        onEditItem={(item) => openFormModal("editTariff", item)}
        onDeleteItem={(item) => openFormModal("deleteTariff", item)}
        visible={managementModal === "tariff"}
        onCancel={closeManagementModal}
        loading={status === "loading"}
      />

      <ManagementModal
        title="Manage Room Presets"
        columns={presetColumns}
        data={presets}
        onAddItem={() => openFormModal("addPreset")}
        onEditItem={(item) => openFormModal("editPreset", item)}
        onDeleteItem={(item) => openFormModal("deletePreset", item)}
        visible={managementModal === "preset"}
        onCancel={closeManagementModal}
        loading={status === "loading"}
      />

      {/* Form Modals */}
      <BlockFormModal
        mode={modalState.type?.includes("edit") ? "edit" : "add"}
        visible={modalState.type?.includes("Block") && !modalState.type?.includes("delete")}
        onCancel={closeModal}
        block={modalState.data}
        onSubmit={handleSubmit}
        loading={status === "loading"}
      />
      <RoomFormModal
        mode={modalState.type?.includes("edit") ? "edit" : "add"}
        visible={modalState.type?.includes("Room") && !modalState.type?.includes("delete")}
        onCancel={closeModal}
        room={modalState.data}
        blocks={blocks}
        presets={presets}
        tariffs={tariffs}
        onSubmit={handleSubmit}
        loading={status === "loading"}
      />
      <TariffFormModal
        mode={formModal.type?.includes("edit") ? "edit" : "add"}
        visible={formModal.type?.includes("Tariff") && !formModal.type?.includes("delete")}
        onCancel={closeFormModal}
        tariff={formModal.data}
        onSubmit={handleSubmit}
        loading={status === "loading"}
      />
      <RoomPresetFormModal
        mode={formModal.type?.includes("edit") ? "edit" : "add"}
        visible={formModal.type?.includes("Preset") && !formModal.type?.includes("delete")}
        onCancel={closeFormModal}
        preset={formModal.data}
        tariffs={tariffs}
        onSubmit={handleSubmit}
        loading={status === "loading"}
      />

      <GoogleReviewModal visible={reviewModal.visible} onCancel={closeReviewModal} block={reviewModal.block} onSubmit={handleUpdateReviewLink} loading={status === "loading"} />

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        visible={formModal.type?.includes("delete")}
        onCancel={closeFormModal}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        content="Are you sure? This action might not be reversible."
      />
    </Card>
  );
};

export default RoomManagementPage;
