import React, { useState, useMemo, useEffect } from "react";
import { Button, Layout, Menu, Badge, Spin } from "antd";
import { MdDashboard, MdCategory, MdLogout, MdOutlineInventory2, MdOutlineLocalShipping, MdAlternateEmail } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const { Sider } = Layout;
const { SubMenu } = Menu;

import { BarChart3, Users, AlertTriangle, Building, Utensils, User, CreditCard, Settings, BuildingIcon, ShieldAlert, Pencil, UserX, Receipt, UserCog, FileText } from "lucide-react";
import { FiSettings } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser, selectIsMainAdmin, selectAuthStatus } from "../../redux/auth/authSlice";
import { selectAllIssues, selectIssueStatus } from "../../redux/issue/issueSlice";
import { fetchAllAdmins, selectAllAdmins, selectAdminStatus } from "../../redux/admin/adminSlice";

// Base menu items with their feature permission mappings
const BASE_MENU_ITEMS = [
  {
    key: "dashboard",
    icon: <BarChart3 size={18} />,
    label: "Dashboard",
    type: "item",
    permission: null, // Always visible
  },
  {
    key: "customers",
    icon: <Users size={18} />,
    label: "Customer Management",
    type: "item",
    permission: "is_user_management_enabled",
  },
  {
    key: "alerts",
    icon: <AlertTriangle size={18} />,
    label: "Recent Alerts",
    type: "item",
    permission: null, // Always visible
  },
  {
    key: "rooms",
    icon: <Building size={18} />,
    label: "Rooms Management",
    type: "item",
    permission: null, // Always visible
  },
  // {
  //   key: "foods",
  //   icon: <Utensils size={18} />,
  //   label: "Food Management",
  //   type: "item",
  //   permission: "is_food_enabled",
  // },
  {
    key: "issues",
    icon: <ShieldAlert size={18} />,
    label: "Issues Management",
    type: "item",
    permission: null, // Always visible
  },
  {
    key: "payments",
    icon: <CreditCard size={18} />,
    label: "Payments",
    type: "item",
    permission: "is_payment_enabled",
  },
  {
    key: "electricity",
    icon: <Building size={18} />,
    label: "Electricity",
    type: "item",
    permission: "is_electricity_enabled",
  },
  // {
  //   key: "reports",
  //   icon: <BarChart3 size={18} />,
  //   label: "Reports",
  //   type: "item",
  //   permission: "is_report_access_enabled",
  // },
  {
    key: "expenses",
    icon: <Receipt size={18} />,
    label: "Expense Management",
    type: "item",
    permission: "is_expense_management_enabled",
  },
  {
    key: "admin-management",
    icon: <UserCog size={18} />,
    label: "Admin Management",
    type: "item",
    permission: null, // Visibility controlled by isMainAdmin check
    requiresMainAdmin: true,
  },
  {
    key: "settings",
    icon: <FiSettings size={18} />,
    label: "Settings",
    type: "group",
    permission: null, // Always visible
    children: [
      // {
      //   key: "edit-profile",
      //   icon: <Pencil size={18} />,
      //   label: "Edit Profile",
      // },
      {
        key: "activity-logs",
        icon: <FileText size={18} />,
        label: "Activity Logs",
      },
    ],
  },
];

const DEFAULT_SIDEBAR_WIDTH = 250;
const MOBILE_COLLAPSED_WIDTH = 60;

export default function Sidebar({ onSelectMenu, selectedKey }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);

  const toggleCollapsed = () => setCollapsed(!collapsed);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isMainAdmin = useSelector(selectIsMainAdmin);
  const authStatus = useSelector(selectAuthStatus);
  const issues = useSelector(selectAllIssues);
  const issueStatus = useSelector(selectIssueStatus);
  const admins = useSelector(selectAllAdmins);
  const adminStatus = useSelector(selectAdminStatus);

  // Check if we're still determining main admin status
  // If authStatus is "loading" and isMainAdmin is false, we might be checking
  const isCheckingMainAdmin = authStatus === "loading" && isMainAdmin === false && user !== null;

  const unresolvedIssuesCount = useMemo(() => {
    if (!issues || issues.length === 0) return 0;
    return issues.reduce((count, issue) => {
      const normalizedStatus = (issue?.status || "").toLowerCase();
      if (normalizedStatus === "unresolved") {
        return count + 1;
      }
      return count;
    }, 0);
  }, [issues]);

  // Fetch admins if user is main admin (only fetch once when conditions are met)
  useEffect(() => {
    if (isMainAdmin && user?.tenant_id && (adminStatus === "idle" || adminStatus === "failed")) {
      dispatch(fetchAllAdmins(user.tenant_id));
    }
  }, [dispatch, isMainAdmin, user?.tenant_id, adminStatus]);

  // Check if main admin has other admins (excluding current user)
  // Only check after admins have been fetched (status is "succeeded")
  const hasOtherAdmins = useMemo(() => {
    if (!isMainAdmin) return false;
    // Wait for admin fetch to complete before determining
    if (adminStatus !== "succeeded" || !admins || admins.length === 0) return false;
    // Filter out the current user from the admins list
    const otherAdmins = admins.filter((admin) => admin.admin_id !== user?.admin_id);
    return otherAdmins.length > 0;
  }, [isMainAdmin, admins, user?.admin_id, adminStatus]);

  // Determine if we should show loading state in sidebar
  // Show loading if:
  // 1. We're checking main admin status, OR
  // 2. We're a main admin and fetching admins list (but only if we haven't confirmed no other admins yet)
  const isSidebarLoading = useMemo(() => {
    return isCheckingMainAdmin || (isMainAdmin && (adminStatus === "loading" || (adminStatus === "idle" && !hasOtherAdmins)));
  }, [isCheckingMainAdmin, isMainAdmin, adminStatus, hasOtherAdmins]);

  // Determine the default/effective selected key
  const effectiveSelectedKey = useMemo(() => {
    // Only auto-select admin-management if main admin has other admins
    if (isMainAdmin && hasOtherAdmins) {
      // If current selection is dashboard, switch to admin-management
      if (selectedKey === "dashboard") {
        return "admin-management";
      }
      // If no selection, default to admin-management
      if (!selectedKey) {
        return "admin-management";
      }
      return selectedKey;
    }
    // For main admin without other admins, or non-main admins, default to dashboard
    // Also if we're still loading and haven't confirmed other admins, default to dashboard
    if (isMainAdmin && !hasOtherAdmins && adminStatus === "succeeded" && selectedKey === "admin-management") {
      return "dashboard";
    }
    return selectedKey || "dashboard";
  }, [isMainAdmin, hasOtherAdmins, selectedKey, adminStatus]);

  // Auto-select admin-management when main admin has other admins
  // Auto-select dashboard when main admin doesn't have other admins
  useEffect(() => {
    if (isMainAdmin && adminStatus === "succeeded") {
      if (hasOtherAdmins && selectedKey !== "admin-management") {
        onSelectMenu("admin-management");
      } else if (!hasOtherAdmins && selectedKey === "admin-management") {
        onSelectMenu("dashboard");
      }
    }
  }, [isMainAdmin, hasOtherAdmins, selectedKey, onSelectMenu, adminStatus]);

  // Filter menu items based on feature permissions and main admin status
  const filteredMenuItems = useMemo(() => {
    const featurePermissions = user?.feature_permissions || {};

    // If main admin, show menu based on whether they have other admins
    if (isMainAdmin || isCheckingMainAdmin) {
      // Show only "Admin Management" ONLY if we have confirmed other admins exist
      if (hasOtherAdmins && adminStatus === "succeeded") {
        return BASE_MENU_ITEMS.filter((item) => item.key === "admin-management");
      }

      // For all other cases (loading, idle, no other admins, etc.), show full menu WITHOUT Admin Management
      return BASE_MENU_ITEMS.filter((item) => {
        // Hide "Admin Management" unless we've confirmed other admins exist
        if (item.key === "admin-management") {
          return false;
        }
        // Check main admin requirement
        if (item.requiresMainAdmin && !isMainAdmin) {
          return false;
        }
        // If no permission required, always show
        if (!item.permission) {
          return true;
        }
        // Check if the feature is enabled
        return featurePermissions[item.permission] === true;
      });
    }

    // For non-main admins, show full menu based on permissions
    return BASE_MENU_ITEMS.filter((item) => {
      // Hide "Admin Management" for non-main admins
      if (item.key === "admin-management") {
        return false;
      }
      // Check main admin requirement
      if (item.requiresMainAdmin && !isMainAdmin) {
        return false;
      }
      // If no permission required, always show
      if (!item.permission) {
        return true;
      }
      // Check if the feature is enabled
      return featurePermissions[item.permission] === true;
    });
  }, [user?.feature_permissions, isMainAdmin, hasOtherAdmins, adminStatus, isCheckingMainAdmin]);

  const navigate = useNavigate();

  const handleOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
    setOpenKeys(latestOpenKey ? [latestOpenKey] : keys);
  };

  const handleMenuSelect = ({ key }) => {
    onSelectMenu(key);
  };

  const getShadowStyle = () => {
    return window.innerWidth <= 768 && !collapsed ? "0px 0px 1112px 1112px rgb(104, 104, 104, 0.3)" : "none";
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/");
  };

  const renderMenuItem = (item) => {
    const labelContent =
      item.key === "issues" && issueStatus === "succeeded" && unresolvedIssuesCount > 0 ? (
        <span className="flex items-center justify-between w-full gap-2">
          <span>{item.label}</span>
          <Badge count={unresolvedIssuesCount} size="small" style={{ backgroundColor: "#ff4d4f" }} />
        </span>
      ) : (
        item.label
      );

    if (item.type === "group") {
      return (
        <SubMenu key={item.key} icon={item.icon} title={item.label}>
          {item.children.map((child) => (
            <Menu.Item key={child.key} icon={child.icon}>
              {child.label}
            </Menu.Item>
          ))}
        </SubMenu>
      );
    }
    return (
      <Menu.Item key={item.key} icon={item.icon}>
        {labelContent}
      </Menu.Item>
    );
  };

  return (
    <Sider
      width={DEFAULT_SIDEBAR_WIDTH}
      theme="light"
      breakpoint="lg"
      collapsedWidth={MOBILE_COLLAPSED_WIDTH}
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapsed}
      style={{
        background: "#f0f2f5",
        boxShadow: getShadowStyle(),
        zIndex: 10,
        position: "relative",
      }}
    >
      <div className="text-center py-2 border-b border-gray-400 bg-white flex items-center justify-center flex-row gap-3">
        <BuildingIcon size={35} className={` p-1 mt-2 rounded bg-blue-500 fill-white stroke-1 stroke-blue-500 mb-1`} />
        {!collapsed && (
          <div className="text-gray-900 text-start m-0">
            <h2 className="text-md md:text-xl font-semibold"> PG Manager</h2>
            <p className="text-xs">Admin Dashboard</p>
          </div>
        )}
      </div>

      {isSidebarLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 150px)",
            padding: "20px",
          }}
        >
          <Spin size="large" tip="Loading menu..." />
        </div>
      ) : (
        <Menu
          mode="inline"
          defaultSelectedKeys={[effectiveSelectedKey]}
          selectedKeys={[effectiveSelectedKey]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          onSelect={handleMenuSelect}
          style={{
            borderRight: 0,
            height: collapsed ? "calc(100vh - 150px)" : "calc(100vh - 150px)",
          }}
          className="flex-grow overflow-y-auto scrollbar"
        >
          {filteredMenuItems.map(renderMenuItem)}
        </Menu>
      )}

      <div className="flex justify-center items-center w-full">
        <Button onClick={handleLogout} style={{ backgroundColor: "#19314B", borderColor: "#19314B" }} type="primary" icon={<MdLogout size={15} />} className="w-full">
          {!collapsed && "Logout"}
        </Button>
      </div>
    </Sider>
  );
}
