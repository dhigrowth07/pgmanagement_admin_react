import React from "react";
import { Layout } from "antd";
import DashboardContents from "../../pages/dashboard/DashboardContents";
import CustomerPage from "../../pages/dashboard/customer/CustomerPage";
import FoodManagementPage from "../../pages/dashboard/food/FoodManagementPage";
import RoomManagementPage from "../../pages/dashboard/room/RoomManagementPage";
import PaymentManagementPage from "../../pages/dashboard/payment/PaymentManagementPage";
import ElectricityManagementPage from "../../pages/dashboard/electricity/ElectricityManagementPage";
import AlertsPage from "../../pages/dashboard/alerts/AlertsPage";
import IssuesPage from "../../pages/dashboard/issues/IssuesPage";
import ReportsPage from "../../pages/dashboard/reports/ReportsPage";
import DeletionRequestsPage from "../../pages/dashboard/deletionRequests/DeletionRequestsPage";
import ExpenseManagementPage from "../../pages/dashboard/expense/ExpenseManagementPage";
import AdminManagementPage from "../../pages/dashboard/admin/AdminManagementPage";
const { Content: AntContent } = Layout;

const Content = ({ selectedMenu, onMenuChange }) => {
  let content;
  switch (selectedMenu) {
    case "dashboard":
      content = <DashboardContents onMenuChange={onMenuChange} />;
      break;
    case "customers":
      content = <CustomerPage />;
      break;
    case "rooms":
      content = <RoomManagementPage />;
      break;
    case "foods":
      content = <FoodManagementPage />;
      break;
    case "payments":
      content = <PaymentManagementPage />;
      break;
    case "electricity":
      content = <ElectricityManagementPage />;
      break;
    case "alerts":
      content = <AlertsPage />;
      break;
    case "issues":
      content = <IssuesPage />;
      break;
    case "reports":
      content = <ReportsPage />;
      break;
    case "expenses":
      content = <ExpenseManagementPage />;
      break;
    case "deletion-requests":
      content = <DeletionRequestsPage />;
      break;
    case "admin-management":
      content = <AdminManagementPage />;
      break;
    default:
      content = <DashboardContents onMenuChange={onMenuChange} />;
  }

  return (
    <AntContent className="thumb-control" style={{ padding: "6px", height: "85vh", overflow: "auto" }}>
      {content}
    </AntContent>
  );
};

export default Content;
