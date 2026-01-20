import React, { useState } from "react";
import { Button, Dropdown, Menu, Modal, Table, Tag } from "antd";
import { EllipsisOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { MapIcon, BedDouble } from "lucide-react";
import { useDispatch } from "react-redux";
import { getRoomById } from "../../../redux/room/roomSlice";
import dayjs from "dayjs";

/** @param {any} room */
const getRoomStatus = (room) => {
  if (room.current_occupancy >= room.capacity) {
    return { text: "Occupied", color: "green" };
  }
  return { text: "Vacant", color: "blue" };
};

/**
 * @param {object} props
 * @param {any} props.room
 * @param {(room: any) => void} props.onEdit
 * @param {(room: any) => void} props.onView
 * @param {(room: any) => void} props.onManageBeds
 */
const RoomCard = ({ room, onEdit, onView, onManageBeds }) => {
  const status = getRoomStatus(room);
  return (
    <div className={`p-3 border border-gray-200 bg-${status.color}-50 rounded-lg cursor-pointer hover:shadow-md transition-shadow relative group`}>
      <div className="text-center">
        <div className={`text-lg font-bold text-${status.color}-800`}>{room.room_number}</div>
        <div className={`text-xs text-${status.color}-600 mt-1`}>
          {room.current_occupancy} / {room.total_beds} beds
        </div>
        <span className={`inline-block w-2 h-2 bg-${status.color}-500 rounded-full mt-2`} />
      </div>
      <div className="absolute top-1 right-1 group-hover:opacity-100 transition-opacity">
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => onView(room)}>
                View Room
              </Menu.Item>
              <Menu.Item key="beds" icon={<BedDouble size={16} />} onClick={() => onManageBeds(room)}>
                Manage Beds
              </Menu.Item>
              <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => onEdit(room)}>
                Edit
              </Menu.Item>
              {/* <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => onDelete(room)}>Delete</Menu.Item> */}
            </Menu>
          }
          trigger={["click"]}
        >
          <Button type="text" shape="circle" style={{ rotate: "90deg" }} icon={<EllipsisOutlined />} />
        </Dropdown>
      </div>
    </div>
  );
};

// ViewRoomModal component
/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {any} props.room
 * @param {() => void} props.onCancel
 * @param {boolean} props.loading
 */
const ViewRoomModal = ({ visible, room, onCancel, loading }) => {
  if (!room || !visible) return null;

  const activeUsers = Array.isArray(room.active_users_list) ? room.active_users_list : [];
  const vacatingUsers = Array.isArray(room.vacating_users_list) ? room.vacating_users_list : [];
  const bedsList = Array.isArray(room.beds_list) ? room.beds_list : [];

  const userColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (/** @type {string} */ phone) => phone || "-",
    },
    {
      title: "Status",
      key: "status",
      render: (/** @type {any} */ _, /** @type {any} */ record) => {
        if (record.vacating_on) {
          const daysLeft = record.days_left;
          return <Tag color="orange">Vacating {daysLeft !== null && daysLeft !== undefined ? `(${daysLeft} days left)` : ""}</Tag>;
        }
        return <Tag color="green">Active</Tag>;
      },
    },
    {
      title: "Vacating Date",
      dataIndex: "vacating_on",
      key: "vacating_on",
      render: (/** @type {string} */ date) => (date ? dayjs(date).format("DD MMM, YYYY") : "-"),
    },
  ];

  const bedColumns = [
    {
      title: "Bed Code",
      dataIndex: "bed_code",
      key: "bed_code",
      render: (/** @type {string} */ text, record) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: "10px", color: "#8c8c8c" }}>ID: {record.bed_id}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "bed_status",
      key: "bed_status",
      render: (/** @type {string} */ status) => {
        const colorMap /** @type {Record<string, string>} */ = {
          AVAILABLE: "success",
          OCCUPIED: "blue",
          MAINTENANCE: "warning",
          RESERVED: "purple",
        };
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Occupied By",
      dataIndex: "user_id",
      key: "user_id",
      render: (/** @type {any} */ userId, /** @type {any} */ record) => {
        if (!userId) return <span className="text-gray-400">-</span>;
        // Find user in active users list
        const user = activeUsers.find((/** @type {any} */ u) => u.user_id === userId);
        return user ? user.name : `User #${userId}`;
      },
    },
    {
      title: "Occupied Since",
      dataIndex: "occupied_since",
      key: "occupied_since",
      render: (/** @type {string} */ date) => (date ? dayjs(date).format("DD MMM, YYYY") : "-"),
    },
  ];

  const totalBeds = parseInt(room.total_beds) || 0;
  const availableBeds = parseInt(room.available_beds) || 0;
  const occupiedBeds = parseInt(room.occupied_beds) || 0;

  return (
    <Modal title={`Room ${room.room_number} - Details`} open={visible} onCancel={onCancel} footer={null} width={900}>
      <div className="mb-4 space-y-2">
        <p>
          <strong>Block:</strong> {room.block_name || "N/A"}
        </p>
        <p>
          <strong>Tariff:</strong> {room.tariff_name || "N/A"} (₹{parseFloat(room.fixed_fee || 0).toLocaleString("en-IN")})
        </p>
        <div className="grid grid-cols-2 gap-4 mt-3 p-3 bg-gray-50 rounded">
          <div>
            <p className="text-sm text-gray-600">Room Capacity</p>
            <p className="text-lg font-semibold">{room.capacity} beds</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Beds Created</p>
            <p className="text-lg font-semibold">{totalBeds} beds</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Available Beds</p>
            <p className="text-lg font-semibold text-green-600">{availableBeds} beds</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Occupied Beds</p>
            <p className="text-lg font-semibold text-blue-600">{occupiedBeds} beds</p>
          </div>
        </div>
      </div>

      {bedsList.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Beds ({bedsList.length})</h4>
          <Table dataSource={bedsList} columns={bedColumns} rowKey="bed_id" pagination={false} size="small" />
        </div>
      )}

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Active Tenants ({activeUsers.length})</h4>
        {activeUsers.length > 0 ? (
          <Table dataSource={activeUsers} columns={userColumns} rowKey="user_id" pagination={false} size="small" loading={loading} />
        ) : (
          <p className="text-gray-500 text-sm">No active tenants in this room.</p>
        )}
      </div>

      {vacatingUsers.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Vacating Tenants ({vacatingUsers.length})</h4>
          <Table dataSource={vacatingUsers} columns={userColumns} rowKey="user_id" pagination={false} size="small" loading={loading} />
        </div>
      )}
    </Modal>
  );
};

/**
 * @param {object} props
 * @param {any[]} props.blocks
 * @param {(room: any) => void} props.onEditRoom
 * @param {(room: any) => void} props.onDeleteRoom
 * @param {(block: any) => void} props.onEditBlock
 * @param {(block: any) => void} props.onDeleteBlock
 * @param {(block: any) => void} props.onOpenReview
 * @param {(room: any) => void} props.onManageBeds
 */
const RoomsTable = ({ blocks, onEditRoom, onDeleteRoom, onEditBlock, onDeleteBlock, onOpenReview, onManageBeds }) => {
  const dispatch = useDispatch();
  /** @type {[Record<string, number>, Function]} */
  const [visibleRoomsPerBlock, setVisibleRoomsPerBlock] = useState({});
  const [viewRoomModal, setViewRoomModal] = useState({ visible: false, room: null, loading: false });

  /** @param {string} blockId @param {number} totalRooms */
  const toggleRoomCount = (blockId, totalRooms) => {
    setVisibleRoomsPerBlock((/** @type {Record<string, number>} */ prev) => {
      const currentCount = prev[blockId] || 16;
      if (currentCount >= totalRooms) {
        return { ...prev, [blockId]: 16 };
      }
      return { ...prev, [blockId]: currentCount + 16 };
    });
  };

  /** @param {any} room */
  const handleViewRoom = async (room) => {
    setViewRoomModal({ visible: true, room: null, loading: true });
    try {
      const result = await dispatch(/** @type {any} */ (getRoomById(room.room_id)));
      if (result.payload && !result.error) {
        setViewRoomModal({ visible: true, room: result.payload, loading: false });
      } else {
        setViewRoomModal({ visible: false, room: null, loading: false });
      }
    } catch (error) {
      console.error("Error fetching room details:", error);
      setViewRoomModal({ visible: false, room: null, loading: false });
    }
  };

  const handleCloseViewModal = () => {
    setViewRoomModal({ visible: false, room: null, loading: false });
  };

  if (!blocks || blocks.length === 0) {
    return <div className="text-center p-8 text-gray-500">No rooms or blocks found.</div>;
  }

  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        const occupiedCount = block.rooms.filter((/** @type {any} */ r) => r.current_occupancy >= (parseInt(r.total_beds) || r.capacity || 0)).length;
        const vacantCount = block.rooms.length - occupiedCount;
        const totalBeds = block.rooms.reduce((/** @type {number} */ sum, /** @type {any} */ room) => sum + (parseInt(room.total_beds) || room.capacity || 0), 0);
        const occupiedBeds = block.rooms.reduce((/** @type {number} */ sum, /** @type {any} */ room) => sum + (parseInt(room.occupied_beds) || Math.min(room.current_occupancy || 0, parseInt(room.total_beds) || room.capacity || 0)), 0);
        const vacantBeds = Math.max(totalBeds - occupiedBeds, 0);

        const totalRooms = block.rooms.length;
        const visibleCount = visibleRoomsPerBlock[block.block_id] || 16;
        const roomsToShow = block.rooms.slice(0, visibleCount);

        return (
          <div key={block.block_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">{block.block_name}</h3>

                  <p className="text-gray-600 text-sm">
                    {block.rooms.length} Rooms • Beds: {occupiedBeds}/{totalBeds} ({vacantBeds} vacant)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">{occupiedCount} Occupied</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">{vacantCount} Vacant</span>
                  {/* Only show dropdown for real blocks (not virtual unassigned block) */}
                  {block.block_id !== "unassigned" && (
                    <Dropdown
                      overlay={
                        <Menu>
                          <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => onEditBlock(/** @type {any} */ (block))}>
                            Edit Block
                          </Menu.Item>
                          <Menu.Item key="review" icon={<MapIcon className="w-3 h-3" />} onClick={() => onOpenReview(block)}>
                            Google Review
                          </Menu.Item>
                          {/* {block.rooms.every(room => room.current_occupancy === 0) && (
                            <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => onDeleteBlock(block)}>
                              Delete Block
                            </Menu.Item>
                          )} */}
                        </Menu>
                      }
                      trigger={["click"]}
                    >
                      <Button className="text-gray-500 hover:text-gray-800" type="text" shape="circle" icon={<EllipsisOutlined style={{ fontSize: 18 }} />} />
                    </Dropdown>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {block.rooms.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {roomsToShow.map((/** @type {any} */ room) => (
                      <RoomCard key={room.room_id} room={room} onEdit={onEditRoom} onView={handleViewRoom} onManageBeds={onManageBeds} />
                    ))}
                  </div>
                  {block.rooms.length > 16 && (
                    <div className="text-center mt-4">
                      <Button type="link" onClick={() => toggleRoomCount(block.block_id, totalRooms)}>
                        {visibleCount >= totalRooms ? "Show Less" : `Show ${Math.min(16, totalRooms - visibleCount)} More`}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-400 py-4">No rooms in this block.</div>
              )}
            </div>
          </div>
        );
      })}

      <ViewRoomModal visible={viewRoomModal.visible} room={viewRoomModal.room} onCancel={handleCloseViewModal} loading={viewRoomModal.loading} />
    </div>
  );
};

export default RoomsTable;
