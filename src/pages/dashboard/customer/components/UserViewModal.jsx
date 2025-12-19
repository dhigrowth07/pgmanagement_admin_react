import React from "react";
import { Modal, Descriptions, Tag, Typography, Avatar, Space } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, IdcardOutlined, CalendarOutlined, FileOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const UserViewModal = ({ visible, onCancel, customer }) => {
  console.log("customer:", customer);
  if (!customer) return null;

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
      </Descriptions>
    </Modal>
  );
};

export default UserViewModal;
