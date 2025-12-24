import React from "react";
import { Modal, Descriptions, Tag, Typography, Button, Space, Divider } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const { Title, Text, Paragraph } = Typography;

const ActivityLogDetailsModal = ({ visible, onCancel, log }) => {
  if (!log) return null;

  const getStatusColor = (status) => {
    if (!status) return "default";
    if (status >= 200 && status < 300) return "success";
    if (status >= 300 && status < 400) return "warning";
    if (status >= 400) return "error";
    return "default";
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: "blue",
      POST: "green",
      PUT: "orange",
      PATCH: "purple",
      DELETE: "red",
    };
    return colors[method] || "default";
  };

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(typeof text === "string" ? text : JSON.stringify(text, null, 2));
    toast.success(`${label} copied to clipboard`);
  };

  const requestBody = log.request_body
    ? typeof log.request_body === "string"
      ? JSON.parse(log.request_body)
      : log.request_body
    : null;

  const metadata = log.metadata
    ? typeof log.metadata === "string"
      ? JSON.parse(log.metadata)
      : log.metadata
    : null;

  return (
    <Modal
      title={<Title level={4}>Activity Log Details #{log.log_id}</Title>}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Log ID">
          <Text strong>{log.log_id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="User Type">
          <Tag color={log.user_type === "admin" ? "purple" : "blue"}>
            {log.user_type?.toUpperCase() || "N/A"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="User ID">{log.user_id || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Admin ID">{log.admin_id || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="Activity Type">
          <Tag color="geekblue">{log.activity_type || "N/A"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Activity Category">
          <Tag color="cyan">{log.activity_category || "N/A"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Description">
          <Paragraph style={{ margin: 0 }}>{log.description || "N/A"}</Paragraph>
        </Descriptions.Item>
        <Descriptions.Item label="Endpoint">
          <Space>
            <code style={{ fontSize: "12px" }}>{log.endpoint || "N/A"}</code>
            {log.endpoint && (
              <Button
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(log.endpoint, "Endpoint")}
              />
            )}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Method">
          <Tag color={getMethodColor(log.method)}>{log.method || "N/A"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Response Status">
          <Tag color={getStatusColor(log.response_status)}>
            {log.response_status || "N/A"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="IP Address">
          <Text copyable>{log.ip_address || "N/A"}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="User Agent">
          <div style={{ maxHeight: "100px", overflow: "auto" }}>
            <Text style={{ fontSize: "12px" }}>{log.user_agent || "N/A"}</Text>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {log.created_at ? dayjs(log.created_at).format("DD MMM YYYY, h:mm:ss A") : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Affected Resource Type">
          {log.affected_resource_type || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Affected Resource ID">
          {log.affected_resource_id || "N/A"}
        </Descriptions.Item>
      </Descriptions>

      {requestBody && (
        <>
          <Divider orientation="left">Request Body</Divider>
          <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "4px", position: "relative" }}>
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(requestBody, "Request Body")}
              style={{ position: "absolute", top: 8, right: 8 }}
            />
            <pre style={{ margin: 0, fontSize: "12px", maxHeight: "300px", overflow: "auto" }}>
              {JSON.stringify(requestBody, null, 2)}
            </pre>
          </div>
        </>
      )}

      {metadata && (
        <>
          <Divider orientation="left">Metadata</Divider>
          <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "4px", position: "relative" }}>
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(metadata, "Metadata")}
              style={{ position: "absolute", top: 8, right: 8 }}
            />
            <pre style={{ margin: 0, fontSize: "12px", maxHeight: "300px", overflow: "auto" }}>
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ActivityLogDetailsModal;

