import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Select, Row, Col } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchUnpaidShares, markShareAsPaid, selectUnpaidShares, selectElectricityStatus } from "../../../redux/electricity/electricitySlice";

const { Option } = Select;

const UnpaidSharesTable = () => {
  const dispatch = useDispatch();
  const unpaid = useSelector(selectUnpaidShares);
  const status = useSelector(selectElectricityStatus);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    dispatch(fetchUnpaidShares());
  }, [dispatch]);

  // Extract unique blocks from unpaid shares
  const blocks = useMemo(() => {
    const blockMap = new Map();
    unpaid.forEach((share) => {
      if (share.block_name) {
        blockMap.set(share.block_name, share.block_name);
      }
    });
    return Array.from(blockMap.values()).sort();
  }, [unpaid]);

  // Extract unique rooms filtered by selected block
  const rooms = useMemo(() => {
    const roomMap = new Map();
    unpaid.forEach((share) => {
      if (share.room_number) {
        // If block is selected, only include rooms from that block
        if (!selectedBlock || share.block_name === selectedBlock) {
          roomMap.set(share.room_number, share.room_number);
        }
      }
    });
    return Array.from(roomMap.values()).sort();
  }, [unpaid, selectedBlock]);

  // Filter unpaid shares based on selected block and room
  const filteredUnpaid = useMemo(() => {
    return unpaid.filter((share) => {
      const blockMatch = !selectedBlock || share.block_name === selectedBlock;
      const roomMatch = !selectedRoom || share.room_number === selectedRoom;
      return blockMatch && roomMatch;
    });
  }, [unpaid, selectedBlock, selectedRoom]);

  const handleBlockChange = (value) => {
    setSelectedBlock(value);
    setSelectedRoom(null); // Reset room when block changes
  };

  const handleRoomChange = (value) => {
    setSelectedRoom(value);
  };

  const columns = [
    {
      title: "Block",
      dataIndex: "block_name",
      key: "block_name"
    },
    {
      title: "Room",
      dataIndex: "room_number",
      key: "room_number"
    },
    {
      title: "Month",
      dataIndex: "month",
      key: "month"
    },
    {
      title: "User",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email"
    },
    {
      title: "Share",
      dataIndex: "share_amount",
      key: "share_amount",
      render: (v) => `₹${Number(v).toFixed(2)}`
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Button 
          size="small" 
          type="primary" 
          onClick={() => dispatch(markShareAsPaid(r.id))} 
          loading={status === "loading_action"}
          style={{ padding: '0 8px' }}
        >
          Mark Paid
        </Button>
      ),
    },
  ];

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={8}>
          <h3 className="font-semibold m-0" style={{ fontSize: '1.2rem' }}>Unpaid Shares</h3>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            value={selectedBlock}
            onChange={handleBlockChange}
            placeholder="Select Block"
            allowClear
            style={{ width: "100%" }}
            size="small"
          >
            {blocks.map((block) => (
              <Option key={block} value={block}>
                {block}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            value={selectedRoom}
            onChange={handleRoomChange}
            placeholder="Select Room"
            allowClear
            style={{ width: "100%" }}
            disabled={!selectedBlock}
            size="small"
          >
            {rooms.map((room) => (
              <Option key={room} value={room}>
                {room}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={24} md={24} style={{ textAlign: "right", marginTop: 8 }}>
          <Button 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={() => dispatch(fetchUnpaidShares())} 
            loading={status === "loading_action"}
            style={{ padding: '0 12px' }}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      <Table 
        rowKey={(r) => r.id} 
        dataSource={filteredUnpaid} 
        columns={columns} 
        pagination={{ 
          pageSize: 8,
          size: 'small',
          showSizeChanger: false
        }} 
        scroll={{ x: true }} 
        size="small"
      />
    </div>
  );
};

export default UnpaidSharesTable;
