import React, { useState, useEffect } from "react";
import { Form, Input, Button, DatePicker, Select, Upload, Alert, Typography, Row, Col } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const UserOnboardPage = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  /** @type {[string | null, Function]} */
  const [error, setError] = useState(null);
  /** @type {[Array<any>, Function]} */
  const [idProofFileList, setIdProofFileList] = useState([]);
  /** @type {[Array<any>, Function]} */
  const [availableRooms, setAvailableRooms] = useState([]);

  useEffect(() => {
    // Read tenant_id and admin_id from URL query parameters
    const tenantIdFromUrl = searchParams.get("tenant_id");
    const adminIdFromUrl = searchParams.get("admin_id");

    // Use tenant_id from URL if available, otherwise fallback to hardcoded value (for backward compatibility)
    const tenantId = tenantIdFromUrl || "6a4dc5af-ee9a-4128-a78f-dcb4b0c32330";
    localStorage.setItem("tenant_id", tenantId);

    // Store admin_id if provided in URL
    if (adminIdFromUrl) {
      localStorage.setItem("admin_id", adminIdFromUrl);
    }

    const fetchRooms = async () => {
      try {
        // Public rooms endpoint (no auth required, only tenant_id header)
        // Pass admin_id as query parameter if available to filter rooms by admin
        const adminIdFromUrl = searchParams.get("admin_id");
        const queryParams = adminIdFromUrl ? { admin_id: adminIdFromUrl } : {};
        const res = await api.get("/api/v1/rooms/public", { params: queryParams });
        const allRooms = res.data?.data || [];
        const vacantRooms = allRooms.filter((room) => room.current_occupancy < room.capacity);
        setAvailableRooms(vacantRooms);
      } catch (e) {
        console.error("Failed to load rooms for onboarding:", e);
      }
    };

    fetchRooms();
  }, [searchParams]);

  const handleFinish = async (values) => {
    setError(null);

    // Ensure tenant_id is set (from URL params or fallback)
    const tenantIdFromUrl = searchParams.get("tenant_id");
    const tenantId = tenantIdFromUrl || "6a4dc5af-ee9a-4128-a78f-dcb4b0c32330";
    localStorage.setItem("tenant_id", tenantId);

    // Ensure admin_id is set if provided in URL
    const adminIdFromUrl = searchParams.get("admin_id");
    if (adminIdFromUrl) {
      localStorage.setItem("admin_id", adminIdFromUrl);
    }

    const formData = new FormData();

    // Required/basic fields
    formData.append("name", values.name?.trim() ?? "");
    formData.append("email", values.email?.trim() ?? "");
    formData.append("password", values.password?.trim() ?? "");
    formData.append("phone", values.phone?.trim() ?? "");

    // Optional / additional fields
    if (values.gender) {
      formData.append("gender", values.gender.toLowerCase());
    }

    if (values.dob) {
      formData.append("dob", values.dob.format("YYYY-MM-DD"));
    }

    if (values.emergency_number_one) {
      formData.append("emergency_number_one", values.emergency_number_one.trim());
    }
    if (values.emergency_number_two) {
      formData.append("emergency_number_two", values.emergency_number_two.trim());
    }

    if (values.room_number) {
      formData.append("room_number", values.room_number.trim());
    }

    if (values.advance_amount !== undefined && values.advance_amount !== null && values.advance_amount !== "") {
      formData.append("advance_amount", values.advance_amount);
    }

    // Profile image (single file)
    if (values.profile_image && values.profile_image.length > 0) {
      const fileObj = values.profile_image[0].originFileObj || values.profile_image[0];
      if (fileObj) {
        formData.append("profile_image", fileObj);
      }
    }

    // ID proofs (at least one required)
    idProofFileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append("id_proofs", file.originFileObj);
      }
    });

    // Validate that at least one ID proof is uploaded
    if (idProofFileList.length === 0) {
      setError("Please upload at least one ID proof document.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/api/v1/users/signup-onboard", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(response.data?.msg || "Onboarding request submitted successfully. You will be activated by the admin.");
      form.resetFields();
      setIdProofFileList([]);
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.message || "Failed to submit onboarding form. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-3 py-6 md:py-10">
      <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
        <div className="mb-6 md:mb-8 text-center">
          <Title level={3} style={{ marginBottom: 8 }}>
            Resident Onboarding
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 14 }}>
            Fill in your details to request onboarding to the PG. Your account will be reviewed and activated by the admin.
          </Paragraph>
        </div>

        {error && <Alert message="Submission error" description={error} type="error" showIcon closable className="mb-4" />}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark="optional"
          initialValues={{
            dob: null,
          }}
        >
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Please enter your name" }]}>
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please create a password" },
              {
                min: 6,
                message: "Password must be at least 6 characters",
              },
            ]}
          >
            <Input.Password placeholder="Minimum 6 characters" />
          </Form.Item>

          <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: "Please enter your phone number" }]}>
            <Input placeholder="Mobile number" />
          </Form.Item>

          <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: "Please select your date of birth" }]}>
            <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} disabledDate={(current) => current && current >= dayjs().startOf("day")} />
          </Form.Item>

          <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender" }]}>
            <Select placeholder="Select">
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item name="emergency_number_one" label="Emergency Contact 1">
            <Input placeholder="Primary emergency contact number" />
          </Form.Item>

          <Form.Item name="emergency_number_two" label="Emergency Contact 2">
            <Input placeholder="Secondary emergency contact number" />
          </Form.Item>

          <Form.Item name="room_number" label="Preferred Room" rules={[{ required: true, message: "Please select a room" }]}>
            <Select
              placeholder={availableRooms.length === 0 ? "No rooms available" : "Select a room"}
              disabled={availableRooms.length === 0}
              showSearch
              optionFilterProp="label"
              options={availableRooms.map((room) => ({
                label: `${room.block_name || "Block"} - ${room.room_number} (${room.current_occupancy}/${room.capacity})`,
                value: room.room_number,
              }))}
            />
          </Form.Item>

          <Form.Item name="advance_amount" label="Advance Amount (optional)" tooltip="If you are paying some advance during onboarding.">
            <Input type="number" min={0} step="0.01" placeholder="0.00" />
          </Form.Item>

          <Form.Item
            name="profile_image"
            label="Profile Image (optional)"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e;
              return e && e.fileList ? e.fileList.slice(-1) : [];
            }}
          >
            <Upload beforeUpload={() => false} maxCount={1} accept="image/*" listType="picture">
              <Button icon={<UploadOutlined />}>Upload Profile Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="ID Proof Documents"
            required
            validateStatus={idProofFileList.length === 0 ? "error" : undefined}
            help={idProofFileList.length === 0 ? "Please upload at least one ID proof document" : "At least one ID proof document is required"}
          >
            <Upload
              multiple
              fileList={idProofFileList}
              beforeUpload={(file) => {
                const fileWithMeta = {
                  uid: file.uid || `${file.name}-${Date.now()}`,
                  name: file.name,
                  status: "done",
                  originFileObj: file,
                };
                setIdProofFileList((prev) => [...prev, fileWithMeta]);
                return false;
              }}
              onRemove={(file) => {
                setIdProofFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>Upload ID Proofs</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Supported formats: images or PDFs. At least one document is required (e.g. Aadhar, PAN, Passport, etc.).
            </Text>
          </Form.Item>

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Onboarding Request"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default UserOnboardPage;
