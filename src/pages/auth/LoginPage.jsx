import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, selectAuthStatus, selectIsAuthenticated, selectIsAdmin } from "../../redux/auth/authSlice";
import { Button, Form, Input, Spin } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import { adminEmailRules, adminPasswordRules } from "../../utils/validators";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authStatus = useSelector(selectAuthStatus);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);

  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = authStatus === "loading" || isSubmitting;

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      // Add a small delay to allow toast to be visible before navigation
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const onFinish = async (values) => {
    // Form validation handles required checks, so we can safely trim values
    const email = values.email?.trim();
    const password = values.password?.trim();

    setIsSubmitting(true);
    const payload = {
      email,
      password,
      loginWithoutTenantId: true,
    };

    try {
      await dispatch(loginUser(payload)).unwrap();
      toast.success("Login Successful!");
    } catch (error) {
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
