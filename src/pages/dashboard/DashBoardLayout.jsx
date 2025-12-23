import React, { useState, useEffect } from "react";
import { Layout, Badge, Avatar } from "antd";
import { BellOutlined, LoginOutlined, UserOutlined } from "@ant-design/icons";
import Sidebar from "../../components/shared/SideNav";
import Content from "../../components/shared/Content";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectUser, updateUserProfile, selectAuthStatus, selectSwitchedFrom, checkMainAdmin } from "../../redux/auth/authSlice";
import { Copy, Pencil, Trash } from "lucide-react";
import { DropdownMenu } from "../../components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EditProfileModal from "./setting/components/EditProfileModal";
import { fetchAllIssues } from "../../redux/issue/issueSlice";
import SwitchBackButton from "../../components/shared/SwitchBackButton";

const { Header, Content: AntdContent } = Layout;

const DashBoardLayout = () => {
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  const user = useSelector(selectUser);
  const authStatus = useSelector(selectAuthStatus);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchAllIssues());
    // Check main admin status on mount
    dispatch(checkMainAdmin());
  }, [dispatch]);

  const handleMenuClick = (menuKey) => {
    if (menuKey === "edit-profile") {
      setIsProfileModalVisible(true);
    } else {
      setSelectedMenu(menuKey);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleProfileUpdate = (values) => {
    dispatch(updateUserProfile(values))
      .unwrap()
      .then(() => {
        setIsProfileModalVisible(false);
      })
      .catch((err) => {
        console.error("Profile update failed:", err);
      });
  };

  return (
    <Layout className="h-screen rounded-lg bg-[#F5F5F5] overflow-hidden shadow-lg md:p-1 p-0">
      <Sidebar onSelectMenu={handleMenuClick} selectedKey={selectedMenu} />
      <Layout className="md:m-2 m-0.5 rounded-lg overflow-hidden">
        <Header style={{ background: "blue", color: "white" }} className="px-3 text-white flex items-center justify-between rounded-lg mb-2 shadow-lg min-h-[8px] md:min-h-[100px]">
          <h1 className="text-white md:text-2xl font-bold m-0">{user?.tenant_name ? `${user.tenant_name.toUpperCase()} ADMIN DASHBOARD` : "ADMIN DASHBOARD"}</h1>
          <div className="flex items-center gap-2">
            <SwitchBackButton />
          </div>
        </Header>
        <AntdContent className="rounded-b-lg overflow-hidden p-0 bg-white">
          <Content selectedMenu={selectedMenu} onMenuChange={(menuKey) => setSelectedMenu(menuKey)} />
        </AntdContent>
      </Layout>
      <EditProfileModal visible={isProfileModalVisible} onCancel={() => setIsProfileModalVisible(false)} onSubmit={handleProfileUpdate} loading={authStatus === "loading"} />
    </Layout>
  );
};

export default DashBoardLayout;
