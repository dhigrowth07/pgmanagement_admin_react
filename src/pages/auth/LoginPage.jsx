import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, selectAuthStatus, selectAuthError, selectIsAuthenticated, selectIsAdmin } from "../../redux/auth/authSlice";
import { Button, Form, Input, Alert, Spin } from "antd";
import { LockOutlined, IdcardOutlined, MailOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import { tenantIdRules, adminEmailRules, adminPasswordRules } from "../../utils/validators";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = authStatus === "loading" || isSubmitting;

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const onFinish = async (values) => {
    // Form validation handles required checks, so we can safely trim values
    const tenantId = values.tenantId?.trim();
    const email = values.email?.trim();
    const password = values.password?.trim();

    // Store tenant_id in localStorage before login
    localStorage.setItem("tenant_id", tenantId);
    console.log("[Login] ✅ Tenant ID stored in localStorage:", tenantId);

    setIsSubmitting(true);
    const payload = {
      tenantId,
      email,
      password,
    };

    try {
      // Thunk will throw the error message from rejectWithValue on unwrap
      await dispatch(loginUser(payload)).unwrap();
      toast.success("Login Successful!");
    } catch (error) {
      console.error("[Login] Login failed (caught in component):", error);
      const message = (typeof error === "string" && error) || error?.msg || error?.message || "Login Failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 max-w-md w-full mx-auto border rounded-lg shadow-xl bg-white">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h1>

        {/* {authStatus === 'failed' && authError && (
          <Alert message={authError} type="error" showIcon closable className="mb-4" />
        )} */}

        <Form form={form} name="login" onFinish={onFinish} layout="vertical" requiredMark="optional">
          <Form.Item name="tenantId" label="Tenant ID" rules={tenantIdRules}>
            <Input prefix={<IdcardOutlined />} placeholder="Tenant ID" />
          </Form.Item>

          <Form.Item name="email" label="Admin Email" rules={adminEmailRules}>
            <Input prefix={<MailOutlined />} placeholder="admin@example.com" />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={adminPasswordRules}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spin /> : "Log in"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
