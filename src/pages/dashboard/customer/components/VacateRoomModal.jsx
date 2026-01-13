import React, { useState, useEffect } from "react";
import { Modal, DatePicker, Form, Alert, Space } from "antd";
import dayjs from "dayjs";
import { CalendarOutlined } from "@ant-design/icons";

const VacateRoomModal = ({ visible, customer, onCancel, onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState(null);
  const [defaultDate, setDefaultDate] = useState(null);

  useEffect(() => {
    if (visible && customer) {
      // Calculate default date (end of current month)
      const today = dayjs();
      const lastDayOfMonth = today.endOf("month");
      setDefaultDate(lastDayOfMonth);

      // If customer already has a vacating date, use it
      if (customer.vacating_on) {
        const existingDate = dayjs(customer.vacating_on);
        setSelectedDate(existingDate);
        form.setFieldsValue({ vacating_date: existingDate });
      } else {
        // Set default to end of month
        setSelectedDate(lastDayOfMonth);
        form.setFieldsValue({ vacating_date: lastDayOfMonth });
      }
    } else {
      form.resetFields();
      setSelectedDate(null);
      setDefaultDate(null);
    }
  }, [visible, customer, form]);

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const vacatingDate = values.vacating_date ? values.vacating_date.format("YYYY-MM-DD") : null;
        onSubmit(vacatingDate);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Calculate days left (using start of day for accurate day difference)
  const daysLeft = selectedDate ? dayjs(selectedDate).startOf('day').diff(dayjs().startOf('day'), 'day') : null;

  // Disable dates that are today or in the past
  const disabledDate = (current) => {
    // Disable if the date is before tomorrow
    return current && current < dayjs().add(1, 'day').startOf("day");
  };

  // Max date is handled in the form validation

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>{customer?.vacating_on ? "Update Vacation Date" : "Schedule Vacation"}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={customer?.vacating_on ? "Update Date" : "Schedule Vacation"}
      cancelText="Cancel"
      width={500}
    >
      <Form form={form} layout="vertical">
        <Alert
          message={customer?.vacating_on ? "Update Vacation Date" : "Schedule Customer Vacation"}
          description={
            customer?.vacating_on
              ? `Current vacation date: ${dayjs(customer.vacating_on).format("DD MMMM, YYYY")}. Select a new date to update.`
              : `Select a date when ${customer?.name || "the customer"} should vacate the room. Default is set to the end of the current month.`
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          label="Vacating Date"
          name="vacating_date"
          rules={[
            { required: true, message: "Please select a vacating date" },
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.resolve();
                }
                const selected = dayjs(value);
                const today = dayjs().startOf("day");
                // Check if the selected date is today or in the past
                const tomorrow = dayjs().add(1, 'day').startOf('day');
                if (selected.isBefore(tomorrow)) {
                  return Promise.reject(new Error("Vacating date must be at least one day in the future"));
                }
                const sixMonthsLater = today.add(6, "month");
                if (selected.isAfter(sixMonthsLater)) {
                  return Promise.reject(new Error("Vacating date cannot be more than 6 months in the future"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD MMMM, YYYY"
            placeholder="Select vacating date"
            disabledDate={disabledDate}
            onChange={handleDateChange}
            showToday={false}
            allowClear={false}
          />
        </Form.Item>

        {selectedDate && daysLeft !== null && (
          <Alert
            message={`Selected Date: ${selectedDate.format("DD MMMM, YYYY")}`}
            description={
              daysLeft >= 0
                ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining until vacation`
                : "Invalid date selected"
            }
            type={daysLeft >= 0 ? "success" : "error"}
            style={{ marginTop: 8 }}
          />
        )}

        {defaultDate && !customer?.vacating_on && (
          <Alert
            message="Default Date"
            description={`Default date is set to ${defaultDate.format("DD MMMM, YYYY")} (end of current month). You can change it to any future date.`}
            type="default"
            style={{ marginTop: 8 }}
          />
        )}
      </Form>
    </Modal>
  );
};

export default VacateRoomModal;
