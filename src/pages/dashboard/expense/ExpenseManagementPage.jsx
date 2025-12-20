import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Row, Col, Typography, Space, Spin, Modal } from "antd";
import { PlusOutlined, ExportOutlined, BarChartOutlined, ReloadOutlined, FolderOutlined } from "@ant-design/icons";
import { BadgeIndianRupee, TrendingUp, FolderOpen, Calendar } from "lucide-react";

import {
  fetchExpenses,
  fetchExpenseSummary,
  fetchCategories,
  createExpense,
  updateExpense,
  deleteExpense,
  createCategory,
  updateCategory,
  deleteCategory,
  selectExpenses,
  selectCategories,
  selectExpenseSummary,
  selectExpenseMeta,
  selectExpenseStatus,
  selectExpenseFilters,
  setFilters,
} from "../../../redux/expense/expenseSlice";
import { selectUser } from "../../../redux/auth/authSlice";

import ExpensesTable from "./ExpensesTable";
import ExpenseFormModal from "./components/ExpenseFormModal";
import ExpenseDetailsModal from "./components/ExpenseDetailsModal";
import ExpenseSummaryModal from "./components/ExpenseSummaryModal";
import ExpenseFilters from "./components/ExpenseFilters";
import ExpenseStatistics from "./components/ExpenseStatistics";
import ExpenseCharts from "./components/ExpenseCharts";
import CategoriesTable from "./components/CategoriesTable";
import CategoryFormModal from "./components/CategoryFormModal";
import DeleteConfirmModal from "../../../components/Modals/DeleteConfirmModal";
import * as expenseService from "../../../services/expenseService";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const { Title } = Typography;

const ExpenseManagementPage = () => {
  const dispatch = useDispatch();
  const expenses = useSelector(selectExpenses);
  const categories = useSelector(selectCategories);
  const summary = useSelector(selectExpenseSummary);
  const meta = useSelector(selectExpenseMeta);
  const status = useSelector(selectExpenseStatus);
  const filters = useSelector(selectExpenseFilters);
  const user = useSelector(selectUser);
  const isExpenseEnabled = user?.feature_permissions?.is_expense_management_enabled;

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [categoryModalState, setCategoryModalState] = useState({ type: null, data: null, visible: false, returnToManage: false });
  const [exportLoading, setExportLoading] = useState(false);
  const filtersRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isExpenseEnabled) {
      dispatch(fetchCategories());
      const initialFilters = { page: 1, per_page: 25 };
      dispatch(setFilters(initialFilters));
      filtersRef.current = initialFilters;
      dispatch(fetchExpenses(initialFilters));
      dispatch(fetchExpenseSummary(initialFilters));
      isInitialMount.current = false;
    }
  }, [dispatch, isExpenseEnabled]);

  useEffect(() => {
    if (isExpenseEnabled && !isInitialMount.current && filters && Object.keys(filters).length > 0) {
      const filtersKey = JSON.stringify(filters);
      const prevFiltersKey = filtersRef.current ? JSON.stringify(filtersRef.current) : null;

      if (filtersKey !== prevFiltersKey) {
        filtersRef.current = filters;
        // Ensure page is set, default to 1 if not present
        const filtersWithPage = { ...filters, page: filters.page || 1, per_page: filters.per_page || 25 };
        dispatch(fetchExpenses(filtersWithPage));
        dispatch(fetchExpenseSummary(filtersWithPage));
      }
    }
  }, [dispatch, isExpenseEnabled, filters]);

  const openModal = (type, data = null) => setModalState({ type, data });
  const closeModal = () => setModalState({ type: null, data: null });

  const openCategoryModal = (type, data = null, returnToManage = false) => setCategoryModalState({ type, data, visible: true, returnToManage });
  const closeCategoryModal = () => setCategoryModalState({ type: null, data: null, visible: false, returnToManage: false });

  const handleCreateSubmit = (formData) => {
    dispatch(createExpense(formData)).then((res) => {
      if (!res.error) {
        closeModal();
        dispatch(fetchExpenseSummary(filters));
      }
    });
  };

  const handleUpdateSubmit = (formData) => {
    dispatch(updateExpense({ id: modalState.data.id, data: formData })).then((res) => {
      if (!res.error) {
        closeModal();
        dispatch(fetchExpenseSummary(filters));
      }
    });
  };

  const handleConfirmDelete = () => {
    if (modalState.data?.id) {
      dispatch(deleteExpense(modalState.data.id)).then((res) => {
        if (!res.error) {
          closeModal();
          dispatch(fetchExpenseSummary(filters));
        }
      });
    }
  };

  const handleCategoryCreateSubmit = (payload) => {
    dispatch(createCategory(payload)).then((res) => {
      if (!res.error) {
        if (categoryModalState.returnToManage) {
          setCategoryModalState({ type: "manage", data: null, visible: true, returnToManage: false });
        } else {
          closeCategoryModal();
        }
      }
    });
  };

  const handleCategoryUpdateSubmit = (payload) => {
    dispatch(updateCategory({ id: categoryModalState.data.id, data: payload })).then((res) => {
      if (!res.error) {
        setCategoryModalState({ type: "manage", data: null, visible: true, returnToManage: false });
      }
    });
  };

  const handleCategoryDelete = (category) => {
    dispatch(deleteCategory(category.id));
  };

  const handleExport = async (format = "xlsx") => {
    setExportLoading(true);
    try {
      const response = await expenseService.exportExpenses(filters, format);
      if (format === "xlsx" || format === "excel") {
        // Handle blob download for XLSX
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `expense_report_${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Expense report exported successfully!");
      } else {
        // JSON export - download as file
        const data = response.data?.data || response.data;
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `expense_report_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Expense report exported successfully!");
      }
    } catch (error) {
      toast.error("Failed to export expenses.");
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleRefresh = () => {
    dispatch(fetchExpenses(filters));
    dispatch(fetchExpenseSummary(filters));
  };

  const isLoading = status === "loading";
  const isActionLoading = status === "loading_action";

  if (!isExpenseEnabled) {
    return (
      <Card bordered={false}>
        <Title level={4}>Expense Management</Title>
        <p>Expense management feature is disabled for your account.</p>
      </Card>
    );
  }

  return (
    <Card bordered={false}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={12}>
          <Title level={4} className="pt-0 md:text-left text-center">
            Expense Management
          </Title>
        </Col>
      </Row>

      <ExpenseStatistics summary={summary} meta={meta} />
      <ExpenseCharts summary={summary} meta={meta} />
      <Row style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={12} className="md:text-right text-center">
          <Space direction="horizontal" className="flex justify-between">
            <Button icon={<ReloadOutlined spin={isLoading} />} onClick={handleRefresh} disabled={isLoading}>
              Refresh
            </Button>
            <Button icon={<BarChartOutlined />} onClick={() => openModal("summary")}>
              View Summary
            </Button>
            <Button icon={<ExportOutlined />} onClick={() => handleExport("xlsx")} loading={exportLoading} disabled={exportLoading}>
              Export
            </Button>
            <Button icon={<FolderOutlined />} onClick={() => openCategoryModal("manage")}>
              Manage Categories
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (categories.length === 0) {
                  toast.error("Please create at least one category before adding expenses.");
                  openCategoryModal("create");
                } else {
                  openModal("create");
                }
              }}
            >
              Add Expense
            </Button>
          </Space>
        </Col>
      </Row>

      <ExpenseFilters filters={filters} categories={categories} onFiltersChange={(newFilters) => dispatch(setFilters(newFilters))} />

      <ExpensesTable
        expenses={expenses}
        loading={isLoading && expenses.length === 0}
        onView={(record) => openModal("view", record)}
        onEdit={(record) => openModal("edit", record)}
        onDelete={(record) => openModal("delete", record)}
        categories={categories}
        meta={meta}
        onPaginationChange={(pagination) => {
          dispatch(setFilters({ ...filters, ...pagination }));
        }}
      />

      <ExpenseFormModal
        visible={modalState.type === "create" || modalState.type === "edit"}
        onCancel={closeModal}
        onSubmit={modalState.type === "edit" ? handleUpdateSubmit : handleCreateSubmit}
        loading={isActionLoading}
        expense={modalState.type === "edit" ? modalState.data : null}
        categories={categories}
      />

      <ExpenseDetailsModal visible={modalState.type === "view"} onCancel={closeModal} expenseId={modalState.data?.id} />

      <ExpenseSummaryModal visible={modalState.type === "summary"} onCancel={closeModal} summary={summary} />

      <DeleteConfirmModal
        visible={modalState.type === "delete"}
        onCancel={closeModal}
        onConfirm={handleConfirmDelete}
        title="Confirm Expense Deletion"
        content={`Are you sure you want to delete the expense "${modalState.data?.title}"? This action cannot be undone.`}
      />

      {/* Category Management Modal */}
      <Modal title="Manage Categories" open={categoryModalState.visible && categoryModalState.type === "manage"} onCancel={closeCategoryModal} footer={null} width={700} maskClosable={false}>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCategoryModal("create", null, true)}>
            Add Category
          </Button>
        </div>
        <CategoriesTable categories={categories} loading={isLoading} onEdit={(category) => openCategoryModal("edit", category, true)} onDelete={(category) => handleCategoryDelete(category)} />
      </Modal>

      <CategoryFormModal
        visible={categoryModalState.visible && (categoryModalState.type === "create" || categoryModalState.type === "edit")}
        onCancel={() => {
          if (categoryModalState.returnToManage || categoryModalState.type === "edit") {
            setCategoryModalState({ type: "manage", data: null, visible: true, returnToManage: false });
          } else {
            closeCategoryModal();
          }
        }}
        onSubmit={(payload) => {
          if (categoryModalState.type === "edit") {
            handleCategoryUpdateSubmit(payload);
          } else {
            handleCategoryCreateSubmit(payload);
          }
        }}
        loading={isActionLoading}
        category={categoryModalState.type === "edit" ? categoryModalState.data : null}
      />
    </Card>
  );
};

export default ExpenseManagementPage;
