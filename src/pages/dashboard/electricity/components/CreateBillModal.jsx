import React, { useEffect, useState } from "react";
import { Modal, Form, InputNumber, Select, DatePicker, Alert } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createBill, selectElectricityStatus, selectBills } from "../../../../redux/electricity/electricitySlice";
import moment from "moment";
import { getAllRooms } from "../../../../services/roomService";

const CreateBillModal = ({ visible, onCancel, onCreated }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const status = useSelector(selectElectricityStatus);
  const bills = useSelector(selectBills);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

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

  // Check for duplicate bills when room or month changes
  const checkForDuplicateBill = () => {
    const roomId = form.getFieldValue("room_id");
    const month = form.getFieldValue("month");

    if (!roomId || !month) {
      setDuplicateWarning(false);
      return;
    }

    const monthStr = month.format("YYYY-MM");
    /** @param {any} bill */
    const matchesBill = (bill) => bill.room_id === roomId && bill.month === monthStr;
    const existingBill = bills.find(matchesBill);

    setDuplicateWarning(!!existingBill);
  };

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
        setDuplicateWarning(false);
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
      <Form 
        layout="vertical" 
        form={form}
        onValuesChange={checkForDuplicateBill}
      >
        {/* Duplicate Warning Alert */}
        {duplicateWarning && (
          <Alert
            message="Bill Already Exists"
            description="A bill for this room and month already exists. If you create this bill, the old bill will be updated."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

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
            disabledDate={(current) => {
              // Allow selection of months from the current year and one previous year
              const currentYear = moment().year();
              const currentMonth = moment().month();
              const selectedYear = current.year();
              const selectedMonth = current.month();

              // Disable dates that are not in the current year or one previous year
              if (selectedYear > currentYear || selectedYear < currentYear - 1) {
                return true;
              }

              // For the current year, disable months after the current month
              if (selectedYear === currentYear && selectedMonth > currentMonth) {
                return true;
              }

              return false;
            }}
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
