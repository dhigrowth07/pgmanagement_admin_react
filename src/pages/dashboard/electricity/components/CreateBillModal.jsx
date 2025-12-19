import React, { useEffect, useState } from "react";
import { Modal, Form, InputNumber, Select, DatePicker } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createBill, selectElectricityStatus } from "../../../../redux/electricity/electricitySlice";
import moment from "moment";
import { getAllRooms } from "../../../../services/roomService";

const CreateBillModal = ({ visible, onCancel, onCreated }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const status = useSelector(selectElectricityStatus);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const loadRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await getAllRooms();
        const list = res.data?.data || res.data || [];
        setRooms(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Error loading rooms:", e);
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    loadRooms();
  }, [visible]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        room_id: values.room_id,
        month: values.month.format("YYYY-MM"), // Convert moment to YYYY-MM here
        amount: values.amount,
      };

      console.log("Sending payload:", payload);

      const action = await dispatch(createBill(payload));
      if (!action.error) {
        onCreated?.();
        form.resetFields();
        onCancel?.();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Modal
      title="Create Electricity Bill"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={status === "loading_action"}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        {/* Room Selection */}
        <Form.Item
          label="Room"
          name="room_id"
          rules={[{ required: true, message: "Room is required" }]}
        >
          <Select
            showSearch
            placeholder="Select a room"
            loading={loadingRooms}
            optionFilterProp="label"
            options={rooms.map((r) => ({
              value: r.room_id,
              label: `${r.block_name || "Block"} - Room ${r.room_number} (${r.current_occupancy || 0}/${r.capacity})`,
            }))}
            className="w-full"
            filterOption={(input, option) =>
              (option?.label || "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {/* Month Picker */}
        <Form.Item
          label="Month"
          name="month"
          rules={[{ required: true, message: "Month is required" }]}
        >
          <DatePicker
            picker="month"
            className="w-full"
            format="MMMM YYYY"
            disabledDate={(current) =>
              current && current > moment().endOf("month")
            }
          />
        </Form.Item>

        {/* Amount Input */}
        <Form.Item
          label="Amount"
          name="amount"
          rules={[{ required: true, message: "Amount is required" }]}
        >
          <InputNumber min={1} className="w-full" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateBillModal;
