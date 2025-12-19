import React, { useEffect, useMemo } from "react";
import { Modal, Form, Select, Button, Alert } from "antd";

const ChangeRoomModal = ({ visible, onCancel, customer, onSubmit, loading, error, rooms, blocks }) => {
  const [form] = Form.useForm();

  // Only show rooms with available beds (current_occupancy < capacity)
  // Exclude the room the user is currently in
  const currentRoomId = customer?.room_id ? customer.room_id : null;

  const groupedRooms = useMemo(() => {
    if (!blocks || !rooms) return [];

    return (blocks || [])
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
  }, [blocks, rooms, currentRoomId]);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      form.resetFields();
    }
  }, [visible, form]);

  const handleFinish = (values) => {
    if (values.room_id && customer?.user_id) {
      onSubmit({ userId: customer.user_id, roomId: values.room_id });
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
          <Select placeholder="Select a room" options={groupedRooms} showSearch optionFilterProp="label" />
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

