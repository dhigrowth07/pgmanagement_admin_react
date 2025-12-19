import { Button, Card, Input, Row, Col, Typography, Select } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import DeleteConfirmModal from "../../../components/Modals/DeleteConfirmModal";
const { Title } = Typography;
const { Option } = Select;
import { LucideUsers, Leaf, Beef, Vote } from "lucide-react";
import FoodTable from "./FoodTable";

const roomStats = [
  {
    label: "Active Customers",
    value: 48,
    icon: LucideUsers,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    label: "Veg Preference",
    value: 32,
    icon: Leaf,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    label: "Non-Veg",
    value: 14,
    icon: Beef,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    label: "Active Polls",
    value: 2,
    icon: Vote,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
];

const FoodManagementPage = () => {
  return (
    <Card
      title={
        <Title level={4} className="pt-2">
          Food Management
          <p style={{ fontSize: "12px", color: "#888" }}>Manage meal plans, polls and food preferences</p>
        </Title>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: "#15803D", color: "white" }}>
          Create Poll
        </Button>
      }
      bordered={false}
    >
      <div className="grid grid-cols-1 mb-5 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {roomStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-300">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={10}>
          <Input.Search placeholder="Search rooms..." enterButton={<SearchOutlined />} allowClear />
        </Col>

        <Col xs={24} sm={12} md={14}>
          <Row gutter={[8, 8]} wrap justify="end">
            <Col xs={24} sm={12} md={8}>
              <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: "#2563EB", color: "white" }}>
                Mark Food Availability
              </Button>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Button type="primary" icon={<PlusOutlined />} style={{ backgroundColor: "#374151", color: "white" }}>
                Generate Report{" "}
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>

      <FoodTable />

      <DeleteConfirmModal visible={false} onCancel={() => {}} onConfirm={() => {}} title="Confirm Delete" content="Are you sure you want to delete this item? This action cannot be undone." />
    </Card>
  );
};

export default FoodManagementPage;
