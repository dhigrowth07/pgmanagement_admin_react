import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Select, Button, Alert, message } from "antd";
import { getAvailableBeds } from "../../../../services/bedService";

const { Option } = Select;

/**
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onCancel
 * @param {any} [props.customer]
 * @param {(data: any) => void} props.onSubmit
 * @param {boolean} props.loading
 * @param {string | null} props.error
 * @param {any[]} props.rooms
 * @param {any[]} props.blocks
 */
const ChangeRoomModal = ({ visible, onCancel, customer, onSubmit, loading, error, rooms, blocks }) => {
  const [form] = Form.useForm();
  const [availableBeds, setAvailableBeds] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  /** @type {[string | null, Function]} */
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  // Only show rooms with available beds (current_occupancy < capacity)
  // Exclude the room the user is currently in
  const currentRoomId = customer?.room_id ? customer.room_id : null;

  const groupedRooms = useMemo(() => {
    if (!blocks || !rooms) return [];

    // Get all block IDs that exist
    const existingBlockIds = new Set((blocks || []).map((block) => block.block_id));

    // Group rooms by existing blocks (only show rooms that belong to existing blocks)
    const groupedByBlocks = (blocks || [])
      .map((block) => {
        const blockRooms = (rooms || []).filter((room) => {
          if (room.block_id !== block.block_id) return false;
          // Exclude current room
          if (currentRoomId && room.room_id === currentRoomId) return false;
          // Only show rooms with available beds
          return room.current_occupancy < room.capacity;
        });

        return {
          label: block.block_name || "Unassigned",
          options: blockRooms.map((room) => {
            const blockName = room.block_name || block.block_name || "";
            const availableBeds = (room.capacity || 0) - (room.current_occupancy || 0);
            const label = blockName
              ? `${blockName} - Room ${room.room_number} (${availableBeds} bed${availableBeds !== 1 ? "s" : ""} available)`
              : `Room ${room.room_number} (${availableBeds} bed${availableBeds !== 1 ? "s" : ""} available)`;

            return {
              label,
              value: room.room_id,
            };
          }),
        };
      })
      .filter((group) => group.options.length > 0);

    // Also include rooms with no block_id (null or undefined)
    const unassignedRooms = (rooms || []).filter((room) => {
      // Exclude current room
      if (currentRoomId && room.room_id === currentRoomId) return false;
      // Only show rooms with available beds
      if (room.current_occupancy >= room.capacity) return false;
      // Room has no block_id
      return !room.block_id;
    });

    const result = [...groupedByBlocks];
    if (unassignedRooms.length > 0) {
      const unassignedGroup = {
        label: "Unassigned",
        options: unassignedRooms.map((room) => {
          const availableBeds = (room.capacity || 0) - (room.current_occupancy || 0);
          return {
            label: `Room ${room.room_number} (${availableBeds} bed${availableBeds !== 1 ? "s" : ""} available)`,
            value: room.room_id,
          };
        }),
      };
      result.push(unassignedGroup);
    }

    return result;
  }, [blocks, rooms, currentRoomId]);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      form.resetFields();
      setSelectedRoomId(null);
      setAvailableBeds([]);
    }
  }, [visible, form]);

  useEffect(() => {
    if (selectedRoomId) {
      const fetchBeds = async () => {
        setLoadingBeds(true);
        try {
          const response = await getAvailableBeds(selectedRoomId);
          setAvailableBeds(response.data?.data || []);
        } catch (error) {
          console.error("Error fetching available beds:", error);
          message.error("Failed to load available beds");
        } finally {
          setLoadingBeds(false);
        }
      };
      fetchBeds();
    } else {
      setAvailableBeds([]);
    }
  }, [selectedRoomId]);

  /** @param {string} value */
  const handleRoomChange = (value) => {
    setSelectedRoomId(value);
    form.setFieldsValue({ bed_id: null });
  };

  /** @param {any} values */
  const handleFinish = (values) => {
    if (values.room_id && customer?.user_id) {
      onSubmit({ 
        userId: customer.user_id, 
        roomId: values.room_id, 
        bedId: values.bed_id 
      });
    }
  };

  return (
    <Modal
      centered
      title={`Change Room for ${customer?.name || "Customer"}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {error && <Alert message={error} type="error" showIcon closable className="mb-4" />}

        <Form.Item name="room_id" label="Select New Room" rules={[{ required: true, message: "Please select a room" }]}>
          <Select placeholder="Select a room" options={groupedRooms} showSearch optionFilterProp="label" onChange={handleRoomChange} />
        </Form.Item>

        <Form.Item name="bed_id" label="Select Bed" rules={[{ required: true, message: "Please select a bed" }]}>
          <Select placeholder="Select a bed" loading={loadingBeds} disabled={!selectedRoomId}>
            {availableBeds.map((/** @type {any} */ bed) => (
              <Option key={bed.bed_id} value={bed.bed_id}>
                {bed.bed_code} ({bed.bed_status})
              </Option>
            ))}
          </Select>
        </Form.Item>

        {customer?.room_id && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Current Room:</strong> {customer.block_name ? `${customer.block_name} - ` : ""}Room {customer.room_number}
            </p>
          </div>
        )}

        <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? "Changing Room..." : "Change Room"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangeRoomModal;

