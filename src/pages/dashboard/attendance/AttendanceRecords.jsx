import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Space, DatePicker, Select, Card, Modal, Form, Input, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchAllAttendanceRecords, 
  overrideAttendance,
  selectAttendanceRecords, 
  selectAttendancePagination, 
  selectAttendanceStatus 
} from "../../../redux/attendance/attendanceSlice";
import dayjs from "dayjs";
import { Edit2, MapPin, Search } from "lucide-react";

const { RangePicker } = DatePicker;
const { Option } = Select;

const AttendanceRecords = () => {
  const dispatch = useDispatch();
  const records = useSelector(selectAttendanceRecords);
  const pagination = useSelector(selectAttendancePagination);
  const status = useSelector(selectAttendanceStatus);
  const loading = status === "loading";

  const [filters, setFilters] = useState({
    status: null,
    start_date: null,
    end_date: null,
    page: 1,
    limit: 10,
  });

  const [overrideModalVisible, setOverrideModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [overrideForm] = Form.useForm();

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line
  }, [filters]);

  const fetchRecords = () => {
    const params = {
      limit: filters.limit,
      offset: (filters.page - 1) * filters.limit,
      status: filters.status,
      start_date: filters.start_date,
      end_date: filters.end_date,
    };
    // Remove null/undefined
    Object.keys(params).forEach(key => params[key] == null && delete params[key]);
    
    dispatch(fetchAllAttendanceRecords(params));
  };

  const handleTableChange = (newPagination) => {
    setFilters({
      ...filters,
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
      page: 1, // Reset to page 1 on filter change
    });
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setFilters({
        ...filters,
        start_date: dates[0].format("YYYY-MM-DD"),
        end_date: dates[1].format("YYYY-MM-DD"),
        page: 1,
      });
    } else {
      setFilters({
        ...filters,
        start_date: null,
        end_date: null,
        page: 1,
      });
    }
  };

  const showOverrideModal = (record) => {
    setSelectedRecord(record);
    overrideForm.setFieldsValue({
      status: record.status,
      admin_note: record.admin_note,
    });
    setOverrideModalVisible(true);
  };

  const handleOverrideSubmit = (values) => {
    if (!selectedRecord) return;

    dispatch(overrideAttendance({
      id: selectedRecord.attendance_id,
      overrideData: values,
      searchParams: {
          limit: filters.limit,
          offset: (filters.page - 1) * filters.limit,
          status: filters.status,
          start_date: filters.start_date,
          end_date: filters.end_date,
      }
    }));
    
    setOverrideModalVisible(false);
    setSelectedRecord(null);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "attendance_date",
      key: "attendance_date",
      render: (text) => dayjs(text).format("DD MMM YYYY"),
    },
    {
      title: "User",
      dataIndex: "user_name",
      key: "user_name",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.room_number ? `Room ${record.room_number}` : 'No Room'}</div>
        </div>
      ),
    },
    {
      title: "Marked Time",
      dataIndex: "marked_at",
      key: "marked_at",
      render: (text) => text ? dayjs(text).format("hh:mm A") : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "PRESENT") color = "success";
        if (status === "ABSENT") color = "error";
        if (status === "MISSED") color = "warning";
        if (status === "EXCUSED") color = "processing";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Details",
      key: "details",
      render: (_, record) => (
        <Space size="small">
          {record.distance_from_pg_meters != null && (
            <Tooltip title={`Distance: ${Math.round(record.distance_from_pg_meters)}m from PG`}>
              <Tag icon={<MapPin size={12} />} color="default">
                {Math.round(record.distance_from_pg_meters)}m
              </Tag>
            </Tooltip>
          )}
          {record.is_admin_override && (
            <Tooltip title={`Overridden by admin. Note: ${record.admin_note || 'N/A'}`}>
              <Tag color="purple">Override</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button 
          type="text" 
          size="small" 
          icon={<Edit2 size={16} />} 
          onClick={() => showOverrideModal(record)}
        >
          Override
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card className="mb-4 shadow-sm border-0">
        <div className="flex flex-wrap gap-4 items-center">
          <RangePicker onChange={handleDateRangeChange} />
          
          <Select 
            placeholder="Filter by Status" 
            style={{ width: 150 }} 
            allowClear 
            onChange={(val) => handleFilterChange("status", val)}
          >
            <Option value="PRESENT">Present</Option>
            <Option value="ABSENT">Absent</Option>
            <Option value="MISSED">Missed</Option>
            <Option value="EXCUSED">Excused</Option>
          </Select>

          <Button 
            type="primary" 
            icon={<Search size={16} />} 
            onClick={fetchRecords}
          >
            Refresh
          </Button>
        </div>
      </Card>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="attendance_id"
        pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: pagination.total, // Use pagination.total from backend if available, or records.length if not
            showSizeChanger: true
        }}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />

      <Modal
        title="Override Attendance"
        open={overrideModalVisible}
        onCancel={() => setOverrideModalVisible(false)}
        footer={null}
      >
        <Form
          form={overrideForm}
          layout="vertical"
          onFinish={handleOverrideSubmit}
        >
          <Form.Item
            name="status"
            label="New Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select>
              <Option value="PRESENT">Present</Option>
              <Option value="ABSENT">Absent</Option>
              <Option value="EXCUSED">Excused</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="admin_note"
            label="Reason for Override"
            rules={[{ required: true, message: "Please provide a reason" }]}
          >
            <Input.TextArea rows={3} placeholder="e.g., GPS issue, user forgot phone..." />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setOverrideModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save Changes</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceRecords;
