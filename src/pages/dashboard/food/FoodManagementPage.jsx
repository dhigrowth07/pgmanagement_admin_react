import React, { useState, useEffect } from "react";
import { Button, Card, Input, Typography, message } from "antd";
import { PlusOutlined, SearchOutlined, CheckCircleOutlined } from "@ant-design/icons";
import MarkAvailabilityModal from "./modals/MarkAvailabilityModal";
import GenerateFoodReportModal from "./modals/GenerateFoodReportModal";
import foodService from "../../../services/foodService";
import FoodTable from "./FoodTable";
import FoodSettingsModal from "./modals/FoodSettingsModal";
import { Users, Leaf, Beef, Vote, Settings } from "lucide-react";

const { Title } = Typography;

const FoodManagementPage = () => {
  const [isPollLoading, setIsPollLoading] = useState(false);
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTableTab, setActiveTableTab] = useState("food");
  const [searchText, setSearchText] = useState("");
  const [mealFilter, setMealFilter] = useState("all");
  const [stats, setStats] = useState([
    { label: "Active Customers", value: 0, icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
    { label: "Veg Preference", value: 0, icon: Leaf, color: "text-green-600", bgColor: "bg-green-100" },
    { label: "Non-Veg", value: 0, icon: Beef, color: "text-rose-600", bgColor: "bg-rose-100" },
    { label: "Active Polls", value: 0, icon: Vote, color: "text-orange-600", bgColor: "bg-orange-100" },
  ]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    fetchStats();
  };

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
      handleRefresh(); // Refresh everything
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
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto order-first sm:order-last">
              <Button
                icon={<Settings size={18} />}
                onClick={() => setIsSettingsOpen(true)}
                className="h-10 px-4 rounded-lg border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200"
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={isPollLoading}
                onClick={handleCreatePoll}
                className="bg-green-700 hover:!bg-green-800 border-none h-10 px-6 rounded-lg flex-1 sm:flex-none font-bold"
              >
                Create Poll
              </Button>
            </div>
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
                onClick={() => {
                  if (stat.label === "Veg Preference") {
                    setActiveTableTab("responses");
                    setMealFilter("breakfast");
                  } else if (stat.label === "Non-Veg") {
                    setActiveTableTab("responses");
                    setMealFilter("lunch");
                  } else if (stat.label === "Active Customers") {
                    setActiveTableTab("responses");
                    setMealFilter("all");
                  } else if (stat.label === "Active Polls") {
                    setActiveTableTab("polls");
                    setMealFilter("all");
                  }
                }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all shadow-sm cursor-pointer
                  ${(stat.label === "Veg Preference" && activeTableTab === "responses" && mealFilter === "breakfast") ||
                    (stat.label === "Non-Veg" && activeTableTab === "responses" && mealFilter === "lunch") ||
                    (stat.label === "Active Customers" && activeTableTab === "responses" && mealFilter === "all")
                    ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                    : (stat.label === "Active Polls" && activeTableTab === "polls")
                      ? "bg-orange-50 border-orange-200 ring-1 ring-orange-200"
                      : "bg-gray-50 border-gray-100 hover:border-blue-200"
                  }`}
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
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
          <FoodTable
            refreshKey={refreshKey}
            activeTab={activeTableTab}
            searchText={searchText}
            mealFilter={mealFilter}
            onTabChange={(tab) => {
              setActiveTableTab(tab);
              if (tab !== "responses") setMealFilter("all");
            }}
          />
        </div>

        {/* Action Modals */}
        <MarkAvailabilityModal
          visible={isMarkOpen}
          onCancel={() => setIsMarkOpen(false)}
          onSuccess={() => {
            setIsMarkOpen(false);
            handleRefresh();
          }}
        />

        <GenerateFoodReportModal
          visible={isReportOpen}
          onCancel={() => setIsReportOpen(false)}
          onSuccess={() => setIsReportOpen(false)}
        />

        <FoodSettingsModal
          visible={isSettingsOpen}
          onCancel={() => setIsSettingsOpen(false)}
          onSuccess={() => {
            setIsSettingsOpen(false);
            handleRefresh();
          }}
        />
      </Card>
    </div>
  );
};

export default FoodManagementPage;
