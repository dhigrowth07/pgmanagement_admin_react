import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Button, DatePicker, Select, Spin, Alert, Row, Col, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;

const CustomerFormModal = ({ mode, visible, onCancel, customer, onSubmit, loading, error, rooms, blocks }) => {
  const [form] = Form.useForm();
  const isEditMode = mode === "edit";
  const isAlreadyOnboarded = isEditMode && !!customer?.room_id;

  const submitButtonText = useMemo(() => {
    if (!isEditMode) return "Create Customer";
    if (isEditMode && !customer?.room_id) return "Onboard Customer";
    if (isEditMode && customer?.room_id) return "Change Room";
    return "Submit";
  }, [isEditMode, customer]);

  const groupedRooms = useMemo(() => {
    if (!blocks?.length || !rooms?.length) return [];
    const availableRooms = rooms.filter((room) => room.current_occupancy < room.capacity);
    return blocks
      .map((block) => ({
        label: block.block_name,
        options: availableRooms
          .filter((room) => room.block_id === block.block_id)
          .map((room) => ({
            label: room.room_number,
            value: room.room_id,
          })),
      }))
      .filter((group) => group.options.length > 0);
  }, [blocks, rooms]);

  /** @type {[Array<any>, Function]} */
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (visible) {
      if (isEditMode && customer) {
        const parsedDob = customer.dob ? dayjs(customer.dob) : null;
        form.setFieldsValue({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          dob: parsedDob,
          gender: customer.gender,
          emergency_number_one: customer.emergency_number_one,
          emergency_number_two: customer.emergency_number_two,
          room_id: customer.room_id,
        });

        // Load existing ID proofs to preserve them
        if (customer.id_proof_urls && customer.id_proof_urls.length > 0) {
          const existingFiles = customer.id_proof_urls.map((url, index) => ({
            uid: `existing-${index}`,
            name: url.split("/").pop(),
            status: "done",
            url,
            isExisting: true,
          }));
          setFileList(existingFiles);
        } else {
          setFileList([]);
        }
      } else {
        form.resetFields();
        setFileList([]);
      }
    }
  }, [customer, visible, isEditMode, form]);

  const handleFinish = (values) => {
    console.log("🌟 Form values:", values);

    if (!values.email || !values.email.trim()) {
      console.error("❌ Email is missing or empty");
      return;
    }

    if (!isEditMode) {
      const prepared = {
        name: values.name?.trim() || "",
        email: values.email?.trim() || "",
        phone: values.phone?.trim() || "",
        password: values.password || "",
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
      };

      console.log("📤 Prepared JSON for signup:", prepared);
      onSubmit(prepared);
    } else {
      const formData = new FormData();
      formData.append("user_id", customer?.user_id || "");
      formData.append("name", values.name?.trim() || "");
      formData.append("email", values.email?.trim() || "");
      formData.append("phone", values.phone?.trim() || "");
      formData.append("dob", values.dob ? values.dob.format("YYYY-MM-DD") : "");
      formData.append("gender", values.gender || "");
      formData.append("emergency_number_one", values.emergency_number_one?.trim() || "");
      formData.append("emergency_number_two", values.emergency_number_two?.trim() || "");
      formData.append("room_id", values.room_id || "");

      // Add new ID proof files
      if (values.id_proofs && values.id_proofs.length > 0) {
        values.id_proofs.forEach((file, idx) => {
          console.log(`📄 Adding file #${idx}:`, file.name);
          if (file.originFileObj && !file.isExisting) formData.append("id_proofs", file.originFileObj);
        });
      }

      // Preserve existing ID proof URLs
      // Get existing URLs from fileList (loaded from customer) or from form values
      const existingUrls = fileList.filter((f) => f && f.isExisting).map((f) => f.url);

      // Also check form values for existing files
      if (values.id_proofs) {
        values.id_proofs.forEach((file) => {
          if (file.isExisting && file.url && !existingUrls.includes(file.url)) {
            existingUrls.push(file.url);
          }
        });
      }

      // Always send existing_id_proof_urls, even if empty array
      formData.append("existing_id_proof_urls", JSON.stringify(existingUrls));

      for (let [k, v] of formData.entries()) {
        console.log(`   ${k}:`, v);
      }

      onSubmit(formData);
    }
  };

  const phoneRules = [
    { required: true, message: "Please enter phone number" },
    { pattern: /^[0-9]{10}$/, message: "Phone number must be 10 digits" },
  ];

  const emergencyRules = [{ pattern: /^[0-9]{10}$/, message: "Must be a valid 10-digit number" }];

  return (
    <Modal
      centered
      title={isEditMode ? (isAlreadyOnboarded ? `Change Room for ${customer?.name || ""}` : "Onboard Customer") : "Add New Customer"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {error && <Alert message={error} type="error" showIcon closable className="mb-4" />}

        {!isAlreadyOnboarded && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="Full Name" rules={[{ required: true, message: "Please enter full name" }]}>
                  <Input readOnly={isEditMode} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Please enter email" },
                    { type: "email", message: "Enter a valid email address" },
                  ]}
                >
                  <Input
                    readOnly={isEditMode}
                    placeholder="user@example.com"
                    onBlur={(e) => {
                      const trimmed = e.target.value.trim();
                      console.log("✏️ Email input blur:", trimmed);
                      form.setFieldsValue({ email: trimmed });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="phone" label="Phone Number" rules={phoneRules}>
                  <Input placeholder="9876543210" />
                </Form.Item>
              </Col>
              <Col span={12}>
                {!isEditMode && (
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                      { required: true, message: "Please set a password" },
                      { min: 6, message: "Password must be at least 6 characters" },
                    ]}
                  >
                    <Input.Password placeholder="******" />
                  </Form.Item>
                )}
              </Col>
            </Row>
          </>
        )}

        {isEditMode && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="dob" label="Date of Birth" rules={[{ required: true, message: "Please select date of birth" }]}>
                  <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} disabledDate={(current) => current && current >= dayjs().startOf("day")} placeholder="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select gender" }]}>
                  <Select placeholder="Select Gender">
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="id_proofs"
              label="Upload ID Proofs"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                const fileList = Array.isArray(e) ? e : e?.fileList || [];
                // Merge with existing files from state
                const newFiles = fileList.filter((f) => !f.isExisting);
                const merged = [...fileList.filter((f) => f.isExisting), ...newFiles];
                setFileList(merged);
                return merged;
              }}
              initialValue={fileList}
              rules={[
                {
                  validator: (_, value) => {
                    const allFiles = value || fileList;
                    const hasFiles = allFiles && allFiles.length > 0;
                    if (!hasFiles) {
                      return Promise.reject(new Error("Please upload at least one ID proof"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Upload
                multiple
                beforeUpload={() => false}
                maxCount={5}
                fileList={fileList}
                onRemove={(file) => {
                  const newFileList = fileList.filter((f) => f.uid !== file.uid);
                  setFileList(newFileList);
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Documents</Button>
              </Upload>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="emergency_number_one" label="Emergency Contact 1" rules={emergencyRules}>
                  <Input placeholder="9876543210" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="emergency_number_two" label="Emergency Contact 2" rules={emergencyRules}>
                  <Input placeholder="Optional" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="room_id" label="Assign Room" rules={[{ required: true, message: "Please assign a room" }]}>
              <Select
                placeholder="Select a room"
                options={groupedRooms}
                showSearch
                allowClear={false}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  String(option?.label || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </>
        )}

        <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? <Spin /> : submitButtonText}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerFormModal;
