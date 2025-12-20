import React from "react";
import { Table, Button, Dropdown, Menu, Space } from "antd";
import { EditOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";

const CategoriesTable = ({ categories, loading, onEdit, onDelete }) => {
  const getMenuItems = (record) => {
    return (
      <Menu>
        <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => onEdit(record)}>
          Edit
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => onDelete(record)}>
          Delete
        </Menu.Item>
      </Menu>
    );
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space>
          {record.icon && <span>{record.icon}</span>}
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      render: (icon) => (icon ? <span>{icon}</span> : <span style={{ color: "#999" }}>—</span>),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: 100,
      render: (_, record) => (
        <Dropdown overlay={getMenuItems(record)} trigger={["click"]}>
          <Button type="text" shape="circle" icon={<EllipsisOutlined style={{ fontSize: "20px" }} />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={categories}
      rowKey="id"
      loading={loading}
      pagination={false}
      size="small"
      locale={{
        emptyText: "No categories found",
      }}
    />
  );
};

export default CategoriesTable;
