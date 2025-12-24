import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Select, DatePicker, InputNumber, Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

// Base categories with their permission mappings
const BASE_ACTIVITY_CATEGORIES = [
  { value: "authentication", label: "Authentication", permission: null }, // Always visible
  { value: "user_management", label: "User Management", permission: "is_user_management_enabled" },
  { value: "payment", label: "Payment", permission: "is_payment_enabled" },
  { value: "room", label: "Room", permission: null }, // Always visible
  { value: "billing", label: "Billing", permission: null }, // Always visible (part of payment/electricity)
  { value: "food", label: "Food", permission: "is_food_enabled" },
  { value: "washing_machine", label: "Washing Machine", permission: "is_washing_machine_enabled" },
  { value: "issue", label: "Issue", permission: null }, // Always visible
  { value: "expense", label: "Expense", permission: "is_expense_management_enabled" },
  { value: "report", label: "Report", permission: "is_report_access_enabled" },
  { value: "settings", label: "Settings", permission: null }, // Always visible
  { value: "export", label: "Export", permission: null }, // Always visible
];

// Base activity types with their category mappings
const BASE_ACTIVITY_TYPES = [
  // Authentication (always visible)
  { value: "login", label: "Login", category: "authentication" },
  { value: "logout", label: "Logout", category: "authentication" },
  { value: "password_change", label: "Password Change", category: "authentication" },
  // User Management
  { value: "user_create", label: "User Create", category: "user_management" },
  { value: "user_update", label: "User Update", category: "user_management" },
  { value: "user_delete", label: "User Delete", category: "user_management" },
  { value: "user_activate", label: "User Activate", category: "user_management" },
  // Payment
  { value: "payment_process", label: "Payment Process", category: "payment" },
  { value: "payment_partial", label: "Payment Partial", category: "payment" },
  // Room (always visible)
  { value: "room_create", label: "Room Create", category: "room" },
  { value: "room_update", label: "Room Update", category: "room" },
  { value: "room_assign", label: "Room Assign", category: "room" },
  // Billing (always visible)
  { value: "bill_view", label: "Bill View", category: "billing" },
  { value: "bill_download", label: "Bill Download", category: "billing" },
  // Issue (always visible)
  { value: "issue_create", label: "Issue Create", category: "issue" },
  { value: "issue_update", label: "Issue Update", category: "issue" },
  { value: "issue_close", label: "Issue Close", category: "issue" },
  // Expense
  { value: "expense_create", label: "Expense Create", category: "expense" },
  { value: "expense_update", label: "Expense Update", category: "expense" },
  { value: "expense_delete", label: "Expense Delete", category: "expense" },
  // Report
  { value: "report_export", label: "Report Export", category: "report" },
  // Generic types (always visible)
  { value: "view", label: "View", category: null },
  { value: "create", label: "Create", category: null },
  { value: "update", label: "Update", category: null },
  { value: "delete", label: "Delete", category: null },
];

const ActivityLogsFilters = ({ filters, onFiltersChange, isAdmin, featurePermissions = {} }) => {
  // Filter categories based on feature permissions
  const filteredCategories = useMemo(() => {
    return BASE_ACTIVITY_CATEGORIES.filter((cat) => {
      // If no permission required, always show
      if (!cat.permission) {
        return true;
      }
      // Check if the feature is enabled
      return featurePermissions[cat.permission] === true;
    });
  }, [featurePermissions]);

  // Filter activity types based on enabled categories
  const filteredActivityTypes = useMemo(() => {
    const enabledCategories = new Set(filteredCategories.map((cat) => cat.value));

    return BASE_ACTIVITY_TYPES.filter((type) => {
      // If type has no category (generic types), always show
      if (!type.category) {
        return true;
      }
      // Only show if the category is enabled
      return enabledCategories.has(type.category);
    });
  }, [filteredCategories]);

  const [localFilters, setLocalFilters] = useState({
    user_type: filters.user_type || undefined,
    user_id: filters.user_id || undefined,
    activity_type: filters.activity_type || undefined,
    activity_category: filters.activity_category || undefined,
    start_date: filters.start_date ? dayjs(filters.start_date) : null,
    end_date: filters.end_date ? dayjs(filters.end_date) : null,
    limit: filters.limit || 50,
  });

  useEffect(() => {
    setLocalFilters({
      user_type: filters.user_type || undefined,
      user_id: filters.user_id || undefined,
      activity_type: filters.activity_type || undefined,
      activity_category: filters.activity_category || undefined,
      start_date: filters.start_date ? dayjs(filters.start_date) : null,
      end_date: filters.end_date ? dayjs(filters.end_date) : null,
      limit: filters.limit || 50,
    });
  }, [filters]);

  // Clear activity_type if the selected category is no longer available
  useEffect(() => {
    if (localFilters.activity_category) {
      const categoryExists = filteredCategories.some((cat) => cat.value === localFilters.activity_category);
      if (!categoryExists) {
        setLocalFilters((prev) => ({ ...prev, activity_category: undefined }));
      }
    }
  }, [filteredCategories, localFilters.activity_category]);

  // Clear activity_type if it's no longer available
  useEffect(() => {
    if (localFilters.activity_type) {
      const typeExists = filteredActivityTypes.some((type) => type.value === localFilters.activity_type);
      if (!typeExists) {
        setLocalFilters((prev) => ({ ...prev, activity_type: undefined }));
      }
    }
  }, [filteredActivityTypes, localFilters.activity_type]);

  const handleApply = () => {
    const newFilters = {
      offset: 0,
      limit: localFilters.limit || 50,
      user_type: localFilters.user_type || undefined,
      user_id: localFilters.user_id || undefined,
      activity_type: localFilters.activity_type || undefined,
      activity_category: localFilters.activity_category || undefined,
      start_date: localFilters.start_date ? localFilters.start_date.format("YYYY-MM-DD") : undefined,
      end_date: localFilters.end_date ? localFilters.end_date.format("YYYY-MM-DD") : undefined,
    };

    // Remove undefined and empty values
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] === undefined || newFilters[key] === "" || newFilters[key] === null) {
        delete newFilters[key];
      }
    });

    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    // Reset local state first
    const resetLocalState = {
      user_type: undefined,
      user_id: undefined,
      activity_type: undefined,
      activity_category: undefined,
      start_date: null,
      end_date: null,
      limit: 50,
    };
    setLocalFilters(resetLocalState);

    // Then update parent/Redux with cleared filters (only offset and limit)
    const resetFilters = {
      offset: 0,
      limit: 50,
    };
    onFiltersChange(resetFilters);
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setLocalFilters({
        ...localFilters,
        start_date: dates[0],
        end_date: dates[1],
      });
    } else {
      setLocalFilters({
        ...localFilters,
        start_date: null,
        end_date: null,
      });
    }
  };

  return (
    <div style={{ marginBottom: 16, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Select placeholder="User Type" value={localFilters.user_type} onChange={(value) => setLocalFilters({ ...localFilters, user_type: value })} allowClear style={{ width: "100%" }}>
            <Option value="user">User</Option>
            <Option value="admin">Admin</Option>
          </Select>
        </Col>
        {isAdmin && (
          <Col xs={24} sm={12} md={6}>
            <InputNumber placeholder="User ID" value={localFilters.user_id} onChange={(value) => setLocalFilters({ ...localFilters, user_id: value })} min={1} style={{ width: "100%" }} />
          </Col>
        )}
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Activity Category"
            value={localFilters.activity_category}
            onChange={(value) => setLocalFilters({ ...localFilters, activity_category: value })}
            allowClear
            style={{ width: "100%" }}
            showSearch
            filterOption={(input, option) => {
              const label = typeof option?.children === "string" ? option.children : Array.isArray(option?.children) ? option.children.join("") : "";
              return label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {filteredCategories.map((cat) => (
              <Option key={cat.value} value={cat.value}>
                {cat.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Activity Type"
            value={localFilters.activity_type}
            onChange={(value) => setLocalFilters({ ...localFilters, activity_type: value })}
            allowClear
            style={{ width: "100%" }}
            showSearch
            filterOption={(input, option) => {
              const label = typeof option?.children === "string" ? option.children : Array.isArray(option?.children) ? option.children.join("") : "";
              return label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {filteredActivityTypes.map((type) => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: "100%" }}
            value={localFilters.start_date && localFilters.end_date ? [localFilters.start_date, localFilters.end_date] : null}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <InputNumber placeholder="Limit" value={localFilters.limit} onChange={(value) => setLocalFilters({ ...localFilters, limit: value })} min={1} max={100} style={{ width: "100%" }} />
        </Col>
        <Col xs={24} sm={24} md={24}>
          <Space>
            <Button type="primary" onClick={handleApply}>
              Apply Filters
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ActivityLogsFilters;
