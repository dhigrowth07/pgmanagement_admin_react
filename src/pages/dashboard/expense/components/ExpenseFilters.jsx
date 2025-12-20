import React, { useState, useEffect } from "react";
import { Row, Col, Input, Select, DatePicker, InputNumber, Button, Space } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

const ExpenseFilters = ({ filters, categories, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState({
    search: filters.search || "",
    category_id: filters.category_id || undefined,
    start_date: filters.start_date ? dayjs(filters.start_date) : null,
    end_date: filters.end_date ? dayjs(filters.end_date) : null,
    min_amount: filters.min_amount || undefined,
    max_amount: filters.max_amount || undefined,
  });

  useEffect(() => {
    setLocalFilters({
      search: filters.search || "",
      category_id: filters.category_id || undefined,
      start_date: filters.start_date ? dayjs(filters.start_date) : null,
      end_date: filters.end_date ? dayjs(filters.end_date) : null,
      min_amount: filters.min_amount || undefined,
      max_amount: filters.max_amount || undefined,
    });
  }, [filters]);

  const handleApply = () => {
    const newFilters = {
      page: 1,
      per_page: filters.per_page || 25,
      search: localFilters.search && localFilters.search.trim() ? localFilters.search.trim() : undefined,
      category_id: localFilters.category_id || undefined,
      start_date: localFilters.start_date ? localFilters.start_date.format("YYYY-MM-DD") : undefined,
      end_date: localFilters.end_date ? localFilters.end_date.format("YYYY-MM-DD") : undefined,
      min_amount: localFilters.min_amount !== undefined && localFilters.min_amount !== null ? localFilters.min_amount : undefined,
      max_amount: localFilters.max_amount !== undefined && localFilters.max_amount !== null ? localFilters.max_amount : undefined,
    };
    // Remove undefined and empty string values
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] === undefined || newFilters[key] === "" || newFilters[key] === null) {
        delete newFilters[key];
      }
    });
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      page: 1,
      per_page: 25,
    };
    setLocalFilters({
      search: "",
      category_id: undefined,
      start_date: null,
      end_date: null,
      min_amount: undefined,
      max_amount: undefined,
    });
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
          <Input
            placeholder="Search by title or notes"
            prefix={<SearchOutlined />}
            value={localFilters.search}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
            onPressEnter={handleApply}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select placeholder="Category" value={localFilters.category_id} onChange={(value) => setLocalFilters({ ...localFilters, category_id: value })} allowClear style={{ width: "100%" }}>
            {categories.map((cat) => (
              <Option key={cat.id} value={cat.id}>
                {cat.name}
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
        <Col xs={24} sm={12} md={4}>
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Min Amount"
            min={0}
            step={0.01}
            precision={2}
            value={localFilters.min_amount}
            onChange={(value) => setLocalFilters({ ...localFilters, min_amount: value })}
            formatter={(value) => (value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
            parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Max Amount"
            min={0}
            step={0.01}
            precision={2}
            value={localFilters.max_amount}
            onChange={(value) => setLocalFilters({ ...localFilters, max_amount: value })}
            formatter={(value) => (value ? `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "")}
            parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
          />
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

export default ExpenseFilters;
