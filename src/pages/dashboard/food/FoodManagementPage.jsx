import React, { useState, useEffect } from "react";
import { Button, Card, Input, Typography, message, Modal } from "antd";
import { PlusOutlined, SearchOutlined, CheckCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import MarkAvailabilityModal from "./modals/MarkAvailabilityModal";
import GenerateFoodReportModal from "./modals/GenerateFoodReportModal";
import foodService from "../../../services/foodService";
import FoodTable from "./FoodTable";
import { Users, Leaf, Beef, Vote } from "lucide-react";

const { Title } = Typography;

const FoodManagementPage = () => {
  const [isPollLoading, setIsPollLoading] = useState(false);
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [stats, setStats] = useState([
    { label: "Active Customers", value: 0, icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
    { label: "Veg Preference", value: 0, icon: Leaf, color: "text-green-600", bgColor: "bg-green-100" },
    { label: "Non-Veg", value: 0, icon: Beef, color: "text-rose-600", bgColor: "bg-rose-100" },
    { label: "Active Polls", value: 0, icon: Vote, color: "text-orange-600", bgColor: "bg-orange-100" },
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const summaryResp = await foodService.getNextDaySummary();
      const s = summaryResp?.data?.data;
      if (s) {
        setStats([
          { label: "Active Customers", value: s.total_subscribers || 0, icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
          { label: "Veg Preference", value: s.breakfast_count || 0, icon: Leaf, color: "text-green-600", bgColor: "bg-green-100" },
          { label: "Non-Veg", value: s.lunch_count || 0, icon: Beef, color: "text-rose-600", bgColor: "bg-rose-100" },
          { label: "Active Polls", value: (s.breakfast_count || s.lunch_count || s.dinner_count) ? 1 : 0, icon: Vote, color: "text-orange-600", bgColor: "bg-orange-100" },
        ]);
      }
    } catch (error) {
      console.error("Error fetching food stats:", error);
    }
  };

  const handleCreatePoll = async () => {
    setIsPollLoading(true);
    const hide = message.loading("Initiating poll notifications...", 0);
    try {
      const response = await foodService.sendMealReminder();
      hide();
      if (response.data.success) {
        const { successful, failed } = response.data.data || {};
        message.success(`Poll notifications sent: ${successful} successful, ${failed ?? 0} failed.`);
      } else {
        message.warning("Poll triggered, but some notifications might have failed.");
      }
      fetchStats(); // Refresh stats
    } catch (error) {
      hide();
      console.error("Poll Error:", error);
      const errorMsg = error.response?.data?.msg || "Failed to send poll notifications. Please check if admin_id is valid.";
      message.error(errorMsg);
    } finally {
      setIsPollLoading(false);
    }
  };

  return (
    <div className="p-0 sm:p-2 md:p-4">
      <Card
        bordered={false}
        className="shadow-md rounded-xl overflow-hidden"
        title={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
              <Title level={4} className="!mb-0">
                Food Management
              </Title>
              <p className="text-gray-400 text-xs mt-1 font-normal">Manage meal plans, polls and food preferences</p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={isPollLoading}
              onClick={handleCreatePoll}
              className="bg-green-700 hover:!bg-green-800 border-none h-10 px-6 rounded-lg w-full sm:w-auto order-first sm:order-last"
            >
              Create Poll
            </Button>
          </div>
        }
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors shadow-sm"
              >
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  {IconComponent && <IconComponent className={`h-5 w-5 ${stat.color}`} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Action Bar */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search rooms, users..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="h-11 rounded-lg border-gray-200"
              allowClear
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setIsMarkOpen(true)}
              className="bg-blue-600 hover:!bg-blue-700 border-none h-11 px-6 rounded-lg font-medium flex-1 sm:flex-none"
            >
              Mark Food Availability
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsReportOpen(true)}
              className="bg-gray-700 hover:!bg-gray-800 border-none h-11 px-6 rounded-lg font-medium flex-1 sm:flex-none"
            >
              Generate Report
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <FoodTable />
        </div>

        {/* Action Modals */}
        <MarkAvailabilityModal
          visible={isMarkOpen}
          onCancel={() => setIsMarkOpen(false)}
          onSuccess={() => {
            setIsMarkOpen(false);
            fetchStats();
          }}
        />

        <GenerateFoodReportModal
          visible={isReportOpen}
          onCancel={() => setIsReportOpen(false)}
          onSuccess={() => setIsReportOpen(false)}
        />
      </Card>
    </div>
  );
};

export default FoodManagementPage;
