import React, { useState, useEffect, useCallback } from "react";
import { Modal, Descriptions, Tag, Typography, Avatar, Space, Button } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, IdcardOutlined, CalendarOutlined, FileOutlined, InfoCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../../../services/api";

const { Title, Text } = Typography;

const UserViewModal = ({ visible, onCancel, customer }) => {
  const [customFieldsModalVisible, setCustomFieldsModalVisible] = useState(false);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Fetch custom field definitions function (must be defined before useEffect)
  const fetchCustomFieldDefinitions = useCallback(async () => {
    try {
      setLoadingFields(true);
      const tenantId = localStorage.getItem("tenant_id");
      if (!tenantId) {
        console.warn("No tenant_id found, cannot fetch custom field definitions");
        return;
      }

      const response = await api.get(`/api/v1/custom-fields/public?tenant_id=${tenantId}`);
      if (response?.data?.data) {
        setCustomFieldDefinitions(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch custom field definitions:", err);
    } finally {
      setLoadingFields(false);
    }
  }, []);

  // Check if customer has custom fields (must be after hooks, but before early return)
  const hasCustomFields = customer?.custom_fields && typeof customer.custom_fields === "object" && Object.keys(customer.custom_fields).length > 0;

  // Fetch custom field definitions when modal opens
  useEffect(() => {
    if (visible && hasCustomFields && customer) {
      fetchCustomFieldDefinitions();
    }
    // Reset custom fields modal when main modal closes
    if (!visible) {
      setCustomFieldsModalVisible(false);
    }
  }, [visible, hasCustomFields, customer, fetchCustomFieldDefinitions]);

  console.log("customer:", customer);
  
  if (!customer) return null;

  const getFieldLabel = (fieldName) => {
    const fieldDef = customFieldDefinitions.find((f) => f.field_name === fieldName);
    return fieldDef ? fieldDef.field_label : fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatCustomFieldValue = (fieldName, value) => {
    const fieldDef = customFieldDefinitions.find((f) => f.field_name === fieldName);
    
    if (!fieldDef) {
      // If no definition found, just return the value as string
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return String(value);
    }

    // Handle select/checkbox with options - show label instead of value
    if ((fieldDef.field_type === "select" || fieldDef.field_type === "checkbox") && fieldDef.options) {
      if (Array.isArray(value)) {
        return value
          .map((val) => {
            const option = fieldDef.options.find((opt) => opt.value === val);
            return option ? option.label : val;
          })
          .join(", ");
      } else {
        const option = fieldDef.options.find((opt) => opt.value === value);
        return option ? option.label : value;
      }
    }

    // Handle date fields
    if (fieldDef.field_type === "date" && value) {
      return dayjs(value).format("DD MMMM, YYYY");
    }

    // Handle number fields
    if (fieldDef.field_type === "number" && value !== null && value !== undefined) {
      return Number(value).toLocaleString();
    }

    // Default: return as string
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return String(value);
  };

  const renderIdProofs = () => {
    if (!customer.id_proof_urls || customer.id_proof_urls.length === 0) {
      return "N/A";
    }

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        {customer.id_proof_urls.map((url, index) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
          const fileName = url.split("/").pop();

          return (
            <div key={index} style={{ marginBottom: 8 }}>
              {isImage ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`ID Proof ${index + 1}`}
                    style={{
                      width: 120,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #eee",
                    }}
                  />
                </a>
              ) : (
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FileOutlined /> {fileName}
                </a>
              )}
            </div>
          );
        })}
      </Space>
    );
  };

  return (
    <Modal title={<Title level={4}>Customer Details: {customer.name}</Title>} open={visible} onCancel={onCancel} footer={null} width={550} centered>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <Avatar src={customer.profile_image_url} icon={!customer.profile_image_url && <UserOutlined />} size={100} />
      </div>
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item
          label={
            <Space>
              <UserOutlined /> Name
            </Space>
          }
        >
          <Text strong>{customer.name}</Text>
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <MailOutlined /> Email
            </Space>
          }
        >
          {customer.email}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <PhoneOutlined /> Phone
            </Space>
          }
        >
          {customer.phone}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <CalendarOutlined /> Date of Birth
            </Space>
          }
        >
          {customer.dob ? dayjs(customer.dob).format("DD MMMM, YYYY") : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Gender">{customer.gender || "N/A"}</Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <IdcardOutlined /> ID Proofs
            </Space>
          }
        >
          {renderIdProofs()}
        </Descriptions.Item>
        <Descriptions.Item label="Emergency Contact 1">{customer.emergency_number_one || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Emergency Contact 2">{customer.emergency_number_two || "N/A"}</Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <HomeOutlined /> Room
            </Space>
          }
        >
          {customer.room_number ? `${customer.room_number} (${customer.block_name})` : <Tag color="orange">Unassigned</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={customer.status === "Active" ? "green" : "red"}>{customer.status}</Tag>
        </Descriptions.Item>
        {hasCustomFields && (
          <Descriptions.Item label="Additional Information">
            <Button
              type="link"
              icon={<InfoCircleOutlined />}
              onClick={() => setCustomFieldsModalVisible(true)}
              style={{ padding: 0 }}
            >
              View Additional Information
            </Button>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Custom Fields Modal */}
      <Modal
        title="Additional Information"
        open={customFieldsModalVisible}
        onCancel={() => setCustomFieldsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCustomFieldsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
        centered
      >
        {loadingFields ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Text type="secondary">Loading field definitions...</Text>
          </div>
        ) : (
          <Descriptions bordered column={1} size="small">
            {Object.entries(customer.custom_fields || {}).map(([fieldName, value]) => {
              const fieldLabel = getFieldLabel(fieldName);
              const formattedValue = formatCustomFieldValue(fieldName, value);

              return (
                <Descriptions.Item key={fieldName} label={fieldLabel}>
                  {formattedValue || "N/A"}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        )}
      </Modal>
    </Modal>
  );
};

export default UserViewModal;
