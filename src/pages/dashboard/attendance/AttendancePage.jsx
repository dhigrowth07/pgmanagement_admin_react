import React, { useState } from "react";
import { Tabs, Card, Typography } from "antd";
import { Settings, List, BarChart3, FileText } from "lucide-react";
import AttendanceConfig from "./AttendanceConfig";
import AttendanceRecords from "./AttendanceRecords";
import AttendanceStats from "./AttendanceStats";
import AttendanceReport from "./AttendanceReport";

const { Title, Text } = Typography;

const AttendancePage = () => {
  const [activeTab, setActiveTab] = useState("records");

  const items = [
    {
      key: "records",
      label: (
        <span className="flex items-center gap-2">
          <List size={16} />
          Records
        </span>
      ),
      children: <AttendanceRecords />,
    },
    {
      key: "stats",
      label: (
        <span className="flex items-center gap-2">
          <BarChart3 size={16} />
          Statistics
        </span>
      ),
      children: <AttendanceStats />,
    },
    {
      key: "reports",
      label: (
        <span className="flex items-center gap-2">
          <FileText size={16} />
          Monthly Report
        </span>
      ),
      children: <AttendanceReport />,
    },
    {
      key: "config",
      label: (
        <span className="flex items-center gap-2">
          <Settings size={16} />
          Configuration
        </span>
      ),
      children: <AttendanceConfig />,
    },
  ];

  return (
    <div className="p-4 mb-5 bg-gray-50 min-h-screen">
      <div >
        <Title level={2} className="m-0">Attendance Management</Title>
        <Text type="secondary">Manage attendance settings, view records, and generate reports.</Text>
      </div>
      
      <Card className="shadow-sm rounded-lg border-0">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          type="card"
          className="attendance-tabs"
        />
      </Card>
    </div>
  );
};

export default AttendancePage;
