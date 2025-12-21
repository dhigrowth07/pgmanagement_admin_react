import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Input, Row, Col, Typography, Select, Space } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

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
  changeRoomCustomer,
  vacateUserRoom,
  cancelVacation,
} from "../../../redux/customer/customerSlice";
import { signupOnboardCustomer } from "../../../services/customerService";
import { selectUser } from "../../../redux/auth/authSlice";
import { generateCustomerPDF } from "../../../utils/pdfGenerator";

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
  const user = useSelector(selectUser);

  const [modalState, setModalState] = useState({ type: null, data: null });
  const [onboardMode, setOnboardMode] = useState("full");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "all", room: "all", block: "all" });
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  const customerUpdateStatus = useSelector((state) => state.customer.status);
  const isAdminUpdateLoading = customerUpdateStatus === "loading_action";
  const isActionLoading = customerStatus === "loading_action";

  useEffect(() => {
    dispatch(fetchAllCustomers());
    dispatch(fetchRoomsData());
  }, [dispatch]);

  const filteredCustomers = useMemo(() => {
    const filtered = customers.filter((customer) => {
      const search = searchTerm.trim().toLowerCase();
      const searchMatch = !search || (customer.name || "").toLowerCase().includes(search) || (customer.email || "").toLowerCase().includes(search);

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

      const finalMatch = searchMatch && statusMatch && roomMatch && blockMatch;

      return finalMatch;
    });

    return filtered;
  }, [customers, searchTerm, filters]);

  const openModal = (type, data = null, mode = "full") => {
    setModalState({ type, data });
    if (type === "onboard") setOnboardMode(mode);
  };

  const handleChangeRoom = ({ userId, roomId }) => {
    if (userId && roomId) {
      dispatch(changeRoomCustomer({ userId, roomId })).then((res) => {
        if (!res.error) {
          closeModal();
        }
      });
    }
  };

  const closeModal = () => setModalState({ type: null, data: null });

  const handleSignupSubmit = async (formData, customerDataForPDF = null, pdfResult = null) => {
    setIsSignupLoading(true);
    try {
      const response = await signupOnboardCustomer(formData);
      if (response.data?.status === 201 || response.status === 201) {
        toast.success(response.data?.msg || "Customer created successfully!");

        // Download PDF only after successful customer creation
        if (pdfResult && pdfResult.doc && pdfResult.fileName) {
          try {
            pdfResult.doc.save(pdfResult.fileName);
            toast.success("PDF generated and downloaded successfully!");
          } catch (pdfError) {
            console.error("Error downloading PDF:", pdfError);
            toast.error("Customer created successfully, but PDF download failed.");
          }
        }

        dispatch(fetchAllCustomers()); // Refresh customer list
        closeModal();
      } else {
        toast.error(response.data?.msg || "Failed to create customer");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || "Failed to create customer";
      toast.error(errorMsg);
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleOnboardSubmit = (payload) => {
    if (payload.userId) {
      dispatch(updateCustomer(payload)).then((res) => !res.error && closeModal());
    } else {
      dispatch(addNewCustomer(payload)).then((res) => !res.error && closeModal());
    }
  };

  const handleConfirmDelete = () => {
    if (!modalState.data) return;
    if (modalState.type === "delete") {
      dispatch(deleteCustomer(modalState.data.user_id));
    } else if (modalState.type === "removeFromRoom") {
      dispatch(removeUserFromRoom(modalState.data.user_id));
    } else if (modalState.type === "vacate") {
      dispatch(vacateUserRoom(modalState.data.user_id));
    } else if (modalState.type === "cancelVacation") {
      dispatch(cancelVacation(modalState.data.user_id));
    }
    closeModal();
  };

  const handleTariffSubmit = ({ tariff_id }) => {
    if (!modalState.data) return;
    dispatch(updateUserTariff({ userId: modalState.data.user_id, tariffId: tariff_id })).then((res) => !res.error && closeModal());
  };

  const handleChangePassword = (newPassword) => {
    if (!modalState.data) return;
    dispatch(changeCustomerPassword({ userId: modalState.data.user_id, newPassword })).then((res) => !res.error && closeModal());
  };

  const handleBulkImportSubmit = (users) => dispatch(bulkImportCustomers(users));
  const closeImportModal = () => {
    setIsImportModalVisible(false);
    dispatch(clearBulkImportResult());
  };
  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters, [type]: value };
    setFilters(newFilters);
  };

  const handleAdminProfileUpdate = (formData) => {
    if (modalState.data?.user_id) {
      dispatch(adminUpdateCustomerProfileThunk({ userId: modalState.data.user_id, formData })).then((res) => {
        if (!res.error) {
          toast.success(res.payload?.msg || "Customer profile updated successfully!");
          closeModal();
        } else {
          toast.error(res.payload?.msg || "Failed to update customer profile.");
        }
      });
    }
  };

  const handleActivateUser = (customer) => {
    if (customer?.user_id) {
      dispatch(activateCustomer(customer.user_id));
    }
  };

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

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={8}>
          <Input.Search placeholder="Search by name or email..." onSearch={(val) => setSearchTerm(val || "")} enterButton allowClear style={{ width: "100%" }} />
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
                  blocks.map((block) => {
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
          </Row>
        </Col>
      </Row>

      <CustomerTable
        customers={filteredCustomers}
        loading={customerStatus === "loading"}
        onView={(record) => openModal("view", record)}
        onEdit={(record) => {
          const mode = record.room_id ? "roomChange" : "full";
          openModal("onboard", record, mode);
        }}
        onDelete={(record) => openModal("delete", record)}
        onChangeTariff={(record) => openModal("changeTariff", record)}
        onChangeRoom={(record) => openModal("changeRoom", record)}
        onRemoveFromRoom={(record) => openModal("removeFromRoom", record)}
        onChangePassword={(record) => openModal("changePassword", record)}
        onAdminUpdateProfile={(record) => openModal("updateProfile", record)}
        onUpdateAdvance={(record) => {
          setSelectedCustomer(record);
          setAdvanceModalVisible(true);
        }}
        onActivate={handleActivateUser}
        onReassign={(record) => {
          // Open onboard modal with full mode to reassign the user
          openModal("onboard", record, "full");
        }}
        onVacateRoom={(record) => openModal("vacate", record)}
        onCancelVacation={(record) => openModal("cancelVacation", record)}
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
        mode={onboardMode}
      />

      <ChangeRoomModal
        visible={modalState.type === "changeRoom"}
        customer={modalState.data}
        onCancel={closeModal}
        onSubmit={handleChangeRoom}
        loading={isActionLoading}
        rooms={rooms}
        blocks={blocks}
      />

      <AdminProfileUpdateModal visible={modalState.type === "updateProfile"} onCancel={closeModal} onSubmit={handleAdminProfileUpdate} loading={isAdminUpdateLoading} customer={modalState.data} />
      <UserViewModal visible={modalState.type === "view"} onCancel={closeModal} customer={modalState.data} />
      <TariffChangeModal visible={modalState.type === "changeTariff"} onCancel={closeModal} onSubmit={handleTariffSubmit} loading={isActionLoading} customer={modalState.data} tariffs={tariffs} />
      <ChangePasswordModal visible={modalState.type === "changePassword"} onCancel={closeModal} onSubmit={handleChangePassword} loading={isActionLoading} customer={modalState.data} />
      <BulkImportModal visible={isImportModalVisible} onCancel={closeImportModal} onSubmit={handleBulkImportSubmit} loading={isActionLoading} apiResult={bulkImportResult} />
      <AdvanceUpdateModal
        visible={advanceModalVisible}
        onCancel={() => {
          setAdvanceModalVisible(false);
          setSelectedCustomer(null);
        }}
        onSubmit={(values) => {
          const { amount } = values;
          dispatch(updateAdvancePayment({ userId: selectedCustomer.user_id, data: { amount } })).then((res) => {
            if (!res.error) {
              setAdvanceModalVisible(false);
              setSelectedCustomer(null);
            }
          });
        }}
        customer={selectedCustomer}
        loading={customerStatus === "loading_action"}
      />

      <DeleteConfirmModal
        visible={modalState.type === "delete" || modalState.type === "removeFromRoom" || modalState.type === "vacate" || modalState.type === "cancelVacation"}
        onCancel={closeModal}
        onConfirm={handleConfirmDelete}
        title={`Confirm Action: ${modalState.data?.name || "Customer"}`}
        content={
          modalState.type === "delete"
            ? "Are you sure you want to permanently delete this customer?"
            : modalState.type === "vacate"
            ? "Are you sure you want to schedule this customer to vacate at the end of the current month? They will be automatically removed from their room on that date."
            : modalState.type === "cancelVacation"
            ? "Are you sure you want to cancel this customer's scheduled vacation? They will remain in their room."
            : "Are you sure you want to remove this customer from their room? This will also unassign their tariff."
        }
        okText={modalState.type === "delete" ? "Delete" : modalState.type === "vacate" ? "Vacate" : modalState.type === "cancelVacation" ? "Cancel Vacation" : "Remove"}
      />
    </Card>
  );
};

export default CustomerPage;
