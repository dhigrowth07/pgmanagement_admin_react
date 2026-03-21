import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Input, Row, Col, Typography, Select, Space } from "antd";
import { PlusOutlined, UploadOutlined, SearchOutlined } from "@ant-design/icons";
import { Users, UserCheck, Clock, CreditCard, AlertCircle } from "lucide-react";
import dayjs from "dayjs";

import {
  fetchAllCustomers,
  selectAllCustomers,
  selectCustomerStatus,
  addNewCustomer,
  updateCustomer,
  deleteCustomer,
  updateUserTariff,
  removeUserFromRoom,
  changeCustomerPassword,
  bulkImportCustomers,
  selectBulkImportResult,
  clearBulkImportResult,
  adminUpdateCustomerProfileThunk,
  updateAdvancePayment,
  activateCustomer,
  rejectCustomer,
  changeRoomCustomer,
  vacateUserRoom,
  cancelVacation,
  updateCustomerId,
} from "../../../redux/customer/customerSlice";
import { signupOnboardCustomer } from "../../../services/customerService";

import { selectAllRooms, selectAllBlocks, selectAllTariffs, fetchRoomsData } from "../../../redux/room/roomSlice";

import CustomerTable from "./CustomerTable";
import SignupFormModal from "./components/SignupFormModal";
import SignupOnboardModal from "./components/SignupOnboardModal";
import OnboardingFormModal from "./components/OnboardingFormModal";
import ChangeRoomModal from "./components/ChangeRoomModal";
import DeleteConfirmModal from "../../../components/Modals/DeleteConfirmModal";
import UserViewModal from "./components/UserViewModal";
import TariffChangeModal from "./components/TariffChangeModal";
import ChangePasswordModal from "./components/ChangePasswordModel";
import BulkImportModal from "./components/BulkImportModal";
import AdminProfileUpdateModal from "./components/AdminProfileUpdateModal";
import AdvanceUpdateModal from "./components/AdvanceUpdateModal";
import UserActivityLogsModal from "./components/UserActivityLogsModal";
import CustomerIdUpdateModal from "./components/CustomerIdUpdateModal";
import VacateRoomModal from "./components/VacateRoomModal";
import toast from "react-hot-toast";

const { Title } = Typography;
const { Option } = Select;

const CustomerPage = () => {
  const dispatch = useDispatch();
  const customers = useSelector(selectAllCustomers);
  const customerStatus = useSelector(selectCustomerStatus);
  const rooms = useSelector(selectAllRooms);
  const blocks = useSelector(selectAllBlocks);
  const tariffs = useSelector(selectAllTariffs);
  const bulkImportResult = useSelector(selectBulkImportResult);

  const [modalState, setModalState] = useState({ type: null, data: null });
  /** @type {["full" | "roomChange", Function]} */
  const [onboardMode, setOnboardMode] = useState("full");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "all", room: "all", block: "all", rentCycle: "all" });
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [activityLogsModalVisible, setActivityLogsModalVisible] = useState(false);
  const [selectedCustomerForLogs, setSelectedCustomerForLogs] = useState(null);

  const customerUpdateStatus = useSelector((/** @type {any} */ state) => state.customer.status);
  const isAdminUpdateLoading = customerUpdateStatus === "loading_action";
  const isActionLoading = customerStatus === "loading_action";

  useEffect(() => {
    dispatch(/** @type {any} */(fetchAllCustomers(undefined)));
    dispatch(/** @type {any} */(fetchRoomsData(undefined)));
  }, [dispatch]);

  const filteredCustomers = useMemo(() => {
    const filtered = customers.filter((/** @type {any} */ customer) => {
      const search = searchTerm.trim().toLowerCase();
      const searchMatch =
        !search ||
        (customer.name || "").toLowerCase().includes(search) ||
        (customer.email || "").toLowerCase().includes(search) ||
        (customer.customer_id || "").toLowerCase().includes(search);

      // Status filter - match against the status field from API response
      let statusMatch = true;
      if (filters.status !== "all") {
        const filterStatus = String(filters.status).trim();

        // Special handling for "Active" - show customers who are currently active
        // (have a room and are active) even if they have future vacation dates
        if (filterStatus === "Active") {
          // Customer is "Active" if they have a room and are active
          // and haven't actually vacated yet (no past vacating_on date)
          const hasRoom = !!customer.room_id;
          const isActive = customer.is_active === true;
          const hasNotVacated = !customer.vacated_date; // No past vacation date

          statusMatch = hasRoom && isActive && hasNotVacated;
        } else if (filterStatus === "Pending") {
          // Special handling for Pending - match registration_status or derive from is_active/room_id
          statusMatch = (customer.registration_status || "pending").toLowerCase() === "pending";
        } else {
          // For other statuses, match against the status field from API
          let customerStatus = customer.status;

          // If status is null, undefined, or empty string, derive it from is_active
          if (!customerStatus || customerStatus.trim() === "") {
            customerStatus = customer.is_active ? "Active" : "Inactive";
          }

          // Normalize both values for comparison
          customerStatus = String(customerStatus).trim();
          statusMatch = customerStatus === filterStatus;
        }
      }

      const roomMatch = filters.room === "all" || (filters.room === "assigned" && !!customer.room_id) || (filters.room === "unassigned" && !customer.room_id);

      // Block filter logic with detailed logging
      let blockMatch = true;
      if (filters.block === "all") {
        blockMatch = true;
      } else if (filters.block === "unassigned") {
        blockMatch = !customer.block_id && !customer.block_name;
      } else {
        // filters.block is a block_id (string from dropdown)
        const filterBlockId = String(filters.block);
        const customerBlockId = customer.block_id ? String(customer.block_id) : null;
        blockMatch = customerBlockId === filterBlockId;
      }

      const rentCycleMatch =
        filters.rentCycle === "all" || (filters.rentCycle === "1-5" && customer.is_active && !!customer.room_id && !!customer.joining_date && dayjs(customer.joining_date).date() <= 5);

      const finalMatch = searchMatch && statusMatch && roomMatch && blockMatch && rentCycleMatch;

      return finalMatch;
    });

    return filtered;
  }, [customers, searchTerm, filters]);

  const openModal = (/** @type {any} */ type, /** @type {any} */ data = null, /** @type {any} */ mode = "full") => {
    setModalState({ type, data });
    if (type === "onboard") setOnboardMode(mode);
  };

  const handleChangeRoom = (/** @type {any} */ { userId, roomId, bedId }) => {
    if (userId && roomId) {
      dispatch(/** @type {any} */(changeRoomCustomer({ userId, roomId, bedId }))).then((/** @type {any} */ res) => {
        if (!res.error) {
          closeModal();
        }
      });
    }
  };

  const closeModal = () => setModalState({ type: null, data: null });

  const handleSignupSubmit = async (/** @type {any} */ formData, /** @type {any} */ customerData, /** @type {any} */ pdfResult = null) => {
    console.log("[Signup] Submitting form for:", customerData?.name);
    setIsSignupLoading(true);
    try {
      const response = await signupOnboardCustomer(formData);
      if (response.data?.status === 201 || response.status === 201) {
        const customerId = response.data?.data?.user?.customer_id;
        const successMessage = customerId
          ? `${response.data?.msg || "Customer created successfully!"} Customer ID: ${customerId}`
          : response.data?.msg || "Customer created successfully!";
        toast.success(successMessage);

        // Download PDF only after successful customer creation
        if (pdfResult && pdfResult.doc && pdfResult.fileName) {
          try {
            console.log("[PDF Download] Attempting to download PDF:", pdfResult.fileName);
            pdfResult.doc.save(pdfResult.fileName);
            console.log("[PDF Download] PDF downloaded successfully");
            toast.success("PDF generated and downloaded successfully!");
          } catch (/** @type {any} */ pdfError) {
            console.error("[PDF Download] Error downloading PDF:", pdfError);
            console.error("[PDF Download] Error stack:", pdfError?.stack);
            toast.error("Customer created successfully, but PDF download failed.");
          }
        } else {
          console.warn("[PDF Download] PDF not available for download. pdfResult:", pdfResult);
          // Check if PDF was uploaded to S3 and can be downloaded from there
          if (response.data?.data?.user?.id_proof_urls) {
            const pdfUrl = (/** @type {string[]} */ (response.data.data.user.id_proof_urls)).find((/** @type {any} */ url) => url.endsWith(".pdf"));
            if (pdfUrl) {
              console.log("[PDF Download] PDF found in S3, downloading from:", pdfUrl);
              const link = document.createElement("a");
              link.href = pdfUrl;
              link.download = `Customer_Registration_${response.data.data.user.name || "Customer"}_${Date.now()}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success("PDF downloaded from server!");
            }
          }
        }

        dispatch(/** @type {any} */(fetchAllCustomers(undefined))); // Refresh customer list
        closeModal();
      } else {
        toast.error(response.data?.msg || "Failed to create customer");
      }
    } catch (/** @type {any} */ error) {
      const errorMsg = error.response?.data?.msg || error.message || "Failed to create customer";
      toast.error(errorMsg);
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleOnboardSubmit = (/** @type {any} */ payload) => {
    if (payload.userId) {
      dispatch(/** @type {any} */(updateCustomer(payload))).then((/** @type {any} */ res) => !res.error && closeModal());
    } else {
      dispatch(/** @type {any} */(addNewCustomer(payload))).then((/** @type {any} */ res) => !res.error && closeModal());
    }
  };

  const handleConfirmDelete = () => {
    if (!modalState.data) return;
    const data = /** @type {any} */ (modalState.data);
    if (modalState.type === "delete") {
      dispatch(/** @type {any} */(deleteCustomer(data.user_id)));
    } else if (modalState.type === "removeFromRoom") {
      dispatch(/** @type {any} */(removeUserFromRoom(data.user_id)));
    } else if (modalState.type === "cancelVacation") {
      dispatch(/** @type {any} */(cancelVacation(data.user_id)));
    }
    closeModal();
  };

  const handleVacateSubmit = (/** @type {any} */ vacatingDate) => {
    if (!modalState.data) return;
    const data = /** @type {any} */ (modalState.data);
    dispatch(/** @type {any} */(vacateUserRoom({ userId: data.user_id, vacatingDate }))).then((/** @type {any} */ res) => {
      if (!res.error) {
        closeModal();
      }
    });
  };

  const handleTariffSubmit = (/** @type {any} */ { tariff_id }) => {
    if (!modalState.data) return;
    const data = /** @type {any} */ (modalState.data);
    dispatch(/** @type {any} */(updateUserTariff({ userId: data.user_id, tariffId: tariff_id }))).then((/** @type {any} */ res) => !res.error && closeModal());
  };

  const handleChangePassword = (/** @type {any} */ newPassword) => {
    if (!modalState.data) return;
    const data = /** @type {any} */ (modalState.data);
    dispatch(/** @type {any} */(changeCustomerPassword({ userId: data.user_id, newPassword }))).then((/** @type {any} */ res) => !res.error && closeModal());
  };

  const handleBulkImportSubmit = (/** @type {any[]} */ users) => dispatch(/** @type {any} */(bulkImportCustomers(users)));
  const closeImportModal = () => {
    setIsImportModalVisible(false);
    dispatch(clearBulkImportResult());
  };
  const handleFilterChange = (/** @type {any} */ type, /** @type {any} */ value) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
  };

  const handleAdminProfileUpdate = (/** @type {any} */ formData) => {
    const data = /** @type {any} */ (modalState.data);
    if (data?.user_id) {
      dispatch(/** @type {any} */(adminUpdateCustomerProfileThunk({ userId: data.user_id, formData }))).then((/** @type {any} */ res) => {
        if (!res.error) {
          const payload = /** @type {any} */ (res.payload);
          toast.success(payload?.msg || "Customer profile updated successfully!");
          closeModal();
        } else {
          const payload = /** @type {any} */ (res.payload);
          toast.error(payload?.msg || "Failed to update customer profile.");
        }
      });
    }
  };

  const handleActivateUser = (/** @type {any} */ customer) => {
    if (customer?.user_id) {
      dispatch(/** @type {any} */(activateCustomer(customer.user_id)));
    }
  };

  const handleRejectUser = (/** @type {any} */ customer) => {
    if (customer?.user_id) {
      dispatch(/** @type {any} */(rejectCustomer(customer.user_id)));
    }
  };

  const handleViewLogs = (/** @type {any} */ customer) => {
    setSelectedCustomerForLogs(customer);
    setActivityLogsModalVisible(true);
  };

  const handleCloseActivityLogsModal = () => {
    setActivityLogsModalVisible(false);
    setSelectedCustomerForLogs(null);
  };

  const handleUpdateCustomerId = (/** @type {any} */ customerId) => {
    if (!modalState.data?.user_id) return;
    const data = /** @type {any} */ (modalState.data);
    dispatch(/** @type {any} */(updateCustomerId({ userId: data.user_id, customerId }))).then((/** @type {any} */ res) => {
      if (!res.error) {
        closeModal();
      }
    });
  };

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.is_active && !!c.room_id).length;
    const rentDue1_5 = customers.filter((c) => {
      // Logic for rent due in first 5 days: joining day is between 1 and 5
      if (!c.is_active || !c.room_id || !c.joining_date) return false;
      const day = dayjs(c.joining_date).date();
      return day >= 1 && day <= 5;
    }).length;
    const pending = customers.filter((c) => (c.registration_status || "pending") === "pending").length;

    return { total, active, rentDue1_5, pending };
  }, [customers]);

  const statCards = [
    { label: "Total Customers", value: stats.total, icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
    { label: "Active Residents", value: stats.active, icon: UserCheck, color: "text-green-600", bgColor: "bg-green-100" },
    { label: "Rent Due (1st-5th)", value: stats.rentDue1_5, icon: CreditCard, color: "text-purple-600", bgColor: "bg-purple-100" },
    { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-orange-600", bgColor: "bg-orange-100" },
  ];

  return (
    <Card bordered={false}>
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Title level={4} className="pt-0 md:text-left text-center">
            Customer Management
          </Title>
        </Col>
        <Col xs={24} sm={12} className="md:text-right text-center">
          <Space wrap>
            {/* <Button icon={<UploadOutlined />} onClick={() => setIsImportModalVisible(true)}>
              Bulk Import
            </Button> */}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal("signup")}>
              Add Customer
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((stat) => {
          const isAllFiltersReset = filters.status === "all" && filters.room === "all" && filters.block === "all" && filters.rentCycle === "all" && searchTerm === "";

          const isActive =
            (stat.label === "Total Customers" && isAllFiltersReset) ||
            (stat.label === "Active Residents" && filters.status === "Active") ||
            (stat.label === "Rent Due (1st-5th)" && filters.rentCycle === "1-5") ||
            (stat.label === "Pending Approval" && filters.status === "Pending");

          return (
            <div
              key={stat.label}
              className={`flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-400 transition-colors ${isActive ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : ''}`}
              onClick={() => {
                if (stat.label === "Total Customers") {
                  setFilters({ status: "all", room: "all", block: "all", rentCycle: "all" });
                  setSearchTerm("");
                } else if (stat.label === "Rent Due (1st-5th)") {
                  setFilters((prev) => ({ ...prev, rentCycle: prev.rentCycle === "1-5" ? "all" : "1-5" }));
                } else if (stat.label === "Active Residents") {
                  const isTogglingOff = filters.status === "Active";
                  setFilters((prev) => ({
                    ...prev,
                    status: isTogglingOff ? "all" : "Active",
                    room: isTogglingOff ? "all" : "assigned",
                  }));
                } else if (stat.label === "Pending Approval") {
                  setFilters((prev) => ({ ...prev, status: prev.status === "Pending" ? "all" : "Pending" }));
                }
              }}
            >
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={8}>
          <Input.Search placeholder="Search by name, email, or customer ID..." onSearch={(val) => setSearchTerm(val || "")} enterButton allowClear style={{ width: "100%" }} />
        </Col>
        <Col xs={24} sm={24} md={16}>
          <Row gutter={[8, 8]} justify="start">
            <Col xs={24} sm={12} md={6}>
              <Select
                value={filters.block}
                style={{ width: "100%" }}
                onChange={(val) => {
                  handleFilterChange("block", val);
                }}
                placeholder="Filter by Block"
                allowClear
              >
                <Option value="all">All Blocks</Option>
                <Option value="unassigned">Unassigned</Option>
                {blocks &&
                  blocks.length > 0 &&
                  blocks.map((/** @type {any} */ block) => {
                    const optionValue = String(block.block_id);
                    return (
                      <Option key={block.block_id} value={optionValue}>
                        {block.block_name}
                      </Option>
                    );
                  })}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select value={filters.room} style={{ width: "100%" }} onChange={(val) => handleFilterChange("room", val)} placeholder="Filter by Room">
                <Option value="all">All Rooms</Option>
                <Option value="assigned">Assigned</Option>
                <Option value="unassigned">Unassigned</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select value={filters.status} style={{ width: "100%" }} onChange={(val) => handleFilterChange("status", val)} placeholder="Filter by Status">
                <Option value="all">All Status</Option>
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
                <Option value="Vacated">Vacated</Option>
                <Option value="Vacating">Vacating</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={filters.rentCycle}
                style={{ width: "100%" }}
                onChange={(val) => handleFilterChange("rentCycle", val)}
                placeholder="Rent Cycle"
                allowClear
              >
                <Option value="all">All Cycles</Option>
                <Option value="1-5">Rent Due (1st-5th)</Option>
              </Select>
            </Col>
          </Row>
        </Col>
      </Row>

      <CustomerTable
        customers={filteredCustomers}
        loading={customerStatus === "loading"}
        onView={(/** @type {any} */ record) => openModal("view", record)}
        onEdit={(/** @type {any} */ record) => {
          const mode = record.room_id ? "roomChange" : "full";
          openModal("onboard", record, mode);
        }}
        onDelete={(/** @type {any} */ record) => openModal("delete", record)}
        onChangeTariff={(/** @type {any} */ record) => openModal("changeTariff", record)}
        onChangeRoom={(/** @type {any} */ record) => openModal("changeRoom", record)}
        onRemoveFromRoom={(/** @type {any} */ record) => openModal("removeFromRoom", record)}
        onChangePassword={(/** @type {any} */ record) => openModal("changePassword", record)}
        onAdminUpdateProfile={(/** @type {any} */ record) => openModal("updateProfile", record)}
        onUpdateAdvance={(/** @type {any} */ record) => {
          setSelectedCustomer(record);
          setAdvanceModalVisible(true);
        }}
        onActivate={handleActivateUser}
        onReject={handleRejectUser}
        onReassign={(/** @type {any} */ record) => {
          // Open onboard modal with full mode to reassign the user
          openModal("onboard", record, "full");
        }}
        onVacateRoom={(/** @type {any} */ record) => openModal("vacate", record)}
        onCancelVacation={(/** @type {any} */ record) => openModal("cancelVacation", record)}
        onViewLogs={handleViewLogs}
        onUpdateCustomerId={(/** @type {any} */ record) => openModal("updateCustomerId", record)}
      />

      <SignupOnboardModal visible={modalState.type === "signup"} onCancel={closeModal} onSubmit={handleSignupSubmit} loading={isSignupLoading} error={null} />

      <OnboardingFormModal
        visible={modalState.type === "onboard"}
        customer={modalState.data}
        onCancel={closeModal}
        onSubmit={handleOnboardSubmit}
        loading={isActionLoading}
        rooms={rooms}
        blocks={blocks}
        error={null}
        mode={onboardMode}
      />

      <ChangeRoomModal
        visible={modalState.type === "changeRoom"}
        customer={modalState.data}
        onCancel={closeModal}
        onSubmit={handleChangeRoom}
        loading={isActionLoading}
        error={null}
        rooms={rooms}
        blocks={blocks}
      />

      <AdminProfileUpdateModal visible={modalState.type === "updateProfile"} onCancel={closeModal} onSubmit={handleAdminProfileUpdate} loading={isAdminUpdateLoading} customer={modalState.data} />
      <UserViewModal visible={modalState.type === "view"} onCancel={closeModal} customer={modalState.data} />
      <TariffChangeModal visible={modalState.type === "changeTariff"} onCancel={closeModal} onSubmit={handleTariffSubmit} loading={isActionLoading} customer={modalState.data} tariffs={tariffs} />
      <ChangePasswordModal visible={modalState.type === "changePassword"} onCancel={closeModal} onSubmit={handleChangePassword} loading={isActionLoading} customer={modalState.data} />
      <CustomerIdUpdateModal visible={modalState.type === "updateCustomerId"} onCancel={closeModal} onSubmit={handleUpdateCustomerId} loading={isActionLoading} customer={modalState.data} />
      <BulkImportModal visible={isImportModalVisible} onCancel={closeImportModal} onSubmit={handleBulkImportSubmit} loading={isActionLoading} apiResult={bulkImportResult} />
      <AdvanceUpdateModal
        visible={advanceModalVisible}
        onCancel={() => {
          setAdvanceModalVisible(false);
          setSelectedCustomer(null);
        }}
        onSubmit={(/** @type {any} */ values) => {
          const { amount } = values;
          if (selectedCustomer) {
            const customer = /** @type {any} */ (selectedCustomer);
            dispatch(/** @type {any} */(updateAdvancePayment({ userId: customer.user_id, data: { amount } }))).then((/** @type {any} */ res) => {
              if (!res.error) {
                setAdvanceModalVisible(false);
                setSelectedCustomer(null);
              }
            });
          }
        }}
        customer={selectedCustomer}
        loading={customerStatus === "loading_action"}
      />

      <VacateRoomModal
        visible={modalState.type === "vacate"}
        customer={modalState.data}
        onCancel={closeModal}
        onSubmit={handleVacateSubmit}
        loading={isActionLoading}
      />

      <DeleteConfirmModal
        visible={modalState.type === "delete" || modalState.type === "removeFromRoom" || modalState.type === "cancelVacation"}
        onCancel={closeModal}
        onConfirm={handleConfirmDelete}
        title={`Confirm Action: ${(/** @type {any} */ (modalState.data))?.name || "Customer"}`}
        content={
          modalState.type === "delete"
            ? "Are you sure you want to permanently delete this customer?"
            : modalState.type === "cancelVacation"
              ? "Are you sure you want to cancel this customer's scheduled vacation? They will remain in their room."
              : "Are you sure you want to remove this customer from their room? This will also unassign their tariff."
        }
        okText={modalState.type === "delete" ? "Delete" : modalState.type === "cancelVacation" ? "Cancel Vacation" : "Remove"}
      />

      <UserActivityLogsModal visible={activityLogsModalVisible} onCancel={handleCloseActivityLogsModal} customer={selectedCustomerForLogs} />
    </Card>
  );
};

export default CustomerPage;
