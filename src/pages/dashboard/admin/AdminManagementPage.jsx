import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Typography } from "antd";
import { fetchAllAdmins, selectAllAdmins, selectAdminStatus, selectAdminError } from "../../../redux/admin/adminSlice";
import { selectUser, checkMainAdmin, selectIsMainAdmin } from "../../../redux/auth/authSlice";
import AdminsTable from "./AdminsTable";
import toast from "react-hot-toast";

const { Title } = Typography;

const AdminManagementPage = () => {
  const dispatch = useDispatch();
  const admins = useSelector(selectAllAdmins);
  const adminStatus = useSelector(selectAdminStatus);
  const adminError = useSelector(selectAdminError);
  const user = useSelector(selectUser);
  const isMainAdmin = useSelector(selectIsMainAdmin);

  // Check main admin status on component mount
  useEffect(() => {
    dispatch(checkMainAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (user?.tenant_id && isMainAdmin) {
      dispatch(fetchAllAdmins(user.tenant_id));
    }
  }, [dispatch, user?.tenant_id, isMainAdmin]);

  useEffect(() => {
    if (adminError) {
      toast.error(adminError);
    }
  }, [adminError]);

  const isLoading = adminStatus === "loading";

  // Show access denied message if not main admin (after check completes)
  if (!isMainAdmin && adminStatus !== "loading" && adminStatus !== "idle") {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <Card className="shadow-sm">
          <div className="text-center py-8">
            <Title level={3}>Access Denied</Title>
            <p className="text-gray-600 mt-2">Only the main admin can access admin management.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Card className="shadow-sm">
        <div className="mb-6">
          <Title level={2}>Admin Management</Title>
          <p className="text-gray-600 mt-2">View and manage all admins for your tenant. Switch to another admin account to view their dashboard.</p>
        </div>

        <AdminsTable admins={admins} loading={isLoading} />
      </Card>
    </div>
  );
};

export default AdminManagementPage;
