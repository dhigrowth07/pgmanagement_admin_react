import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Table, Space, Typography } from "antd";
import * as XLSX from "xlsx";
import { fetchUserSummary } from "../../../services/exportService";

const { Title } = Typography;

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [exportLoadingXlsx, setExportLoadingXlsx] = useState(false);
  const [exportLoadingCsv, setExportLoadingCsv] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const formatDate = (value) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
    } catch {
      return String(value);
    }
  };

  const formatAmountForExport = (value) => {
    const num = Number(value) || 0;
    return num > 0 ? num.toFixed(2) : "";
  };

  const prepareExportData = (rows) => {
    // Filter out empty rooms (only include rows with actual users)
    const userRows = rows.filter((r) => r.user_id && r.room_no);

    // Group users by room_no (trim to handle any whitespace differences)
    const roomGroups = {};
    userRows.forEach((r) => {
      const roomNo = (r.room_no || "").trim();
      if (!roomNo) return; // Skip if no room number
      if (!roomGroups[roomNo]) {
        roomGroups[roomNo] = [];
      }
      roomGroups[roomNo].push(r);
    });

    // Sort room groups by room number for consistent ordering
    const sortedRoomNos = Object.keys(roomGroups).sort();

    const exportData = [];

    // Process each room group
    sortedRoomNos.forEach((roomNo) => {
      const groupRows = roomGroups[roomNo];

      // Sort users within each room by name for consistency
      const sortedGroupRows = [...groupRows].sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      sortedGroupRows.forEach((r, index) => {
        const isFirstInGroup = index === 0;
        const userNo = index + 1;

        // Show each user's own dates, but room number only on first row of each room group
        const joinedDate = formatDate(r.joined_date);
        const vacatedDate = formatDate(r.vacated_date);
        const displayRoomNo = isFirstInGroup ? roomNo : "";

        exportData.push({
          "J Date": joinedDate,
          "V Date": vacatedDate,
          "Room No": displayRoomNo,
          No: userNo,
          Name: r.name || "",
          Rent: formatAmountForExport(r.rent),
          Eb: formatAmountForExport(r.electricity_bill),
          Balance: formatAmountForExport(r.balance),
          Advance: formatAmountForExport(r.advance),
          Paid: formatAmountForExport(r.total_paid_amount),
          "UPI No": r.phone || "",
        });
      });
    });

    return exportData;
  };

  const columns = useMemo(
    () => [
      {
        title: "J Date",
        dataIndex: "display_joined_date",
        key: "display_joined_date",
        render: (v) => (v ? formatDate(v) : ""),
        width: 120,
      },
      {
        title: "V Date",
        dataIndex: "display_vacated_date",
        key: "display_vacated_date",
        render: (v) => (v ? formatDate(v) : ""),
        width: 120,
      },
      {
        title: "Room No",
        dataIndex: "display_room_no",
        key: "display_room_no",
        render: (roomNo) => roomNo || "",
        width: 100,
      },
      // {
      //   title: "No",
      //   dataIndex: "user_no",
      //   key: "user_no",
      //   render: (v) => v || "",
      //   width: 60,
      //   align: "center",
      // },
      { title: "Name", dataIndex: "name", key: "name", render: (v) => v || "-", width: 150 },
      {
        title: "Rent",
        dataIndex: "rent",
        key: "rent",
        render: (rent, record) => {
          if (!record.user_id) return "";
          const amount = Number(rent) || 0;
          return amount > 0 ? amount.toFixed(2) : "";
        },
      },
      {
        title: "Eb",
        dataIndex: "electricity_bill",
        key: "electricity_bill",
        render: (bill, record) => {
          if (!record.user_id) return "";
          const amount = Number(bill) || 0;
          return amount > 0 ? amount.toFixed(2) : "";
        },
      },
      {
        title: "Balance",
        dataIndex: "balance",
        key: "balance",
        render: (balance, record) => {
          if (!record.user_id) return "";
          // Calculate balance as (rent + eb) - paid amount
          const rent = Number(record.rent) || 0;
          const eb = Number(record.electricity_bill) || 0;
          const paid = Number(record.total_paid_amount) || 0;
          const calculatedBalance = (rent + eb) - paid;
          return calculatedBalance > 0 ? calculatedBalance.toFixed(2) : "";
        },
      },
      
      {
        title: "Paid",
        dataIndex: "total_paid_amount",
        key: "total_paid_amount",
        render: (paidAmount, record) => {
          if (!record.user_id) return "";
          const amount = Number(paidAmount) || 0;
          // Always show the amount, even if 0
          return amount.toFixed(2);
        },
      },
    
     
      {
        title: "Advance",
        dataIndex: "advance",
        key: "advance",
        render: (advance, record) => {
          if (!record.user_id) return "";
          const amount = Number(advance) || 0;
          return amount > 0 ? amount.toFixed(2) : "";
        },
      },
    
       { title: "Phone", dataIndex: "phone", key: "phone", render: (v) => v || "" },

      // { title: "User ID", dataIndex: "user_id", key: "user_id" },
      // { title: "Email", dataIndex: "email", key: "email" },
      // { title: "UPI Method", dataIndex: "upi_method", key: "upi_method" },
      // { title: "UPI Reference", dataIndex: "upi_reference", key: "upi_reference" },
    ],
    []
  );

  const processRowsForDisplay = (data) => {
    // Filter out empty rooms (only include rows with actual users)
    const userRows = data.filter((r) => r.user_id && r.room_no);

    // Group users by room_no (trim to handle any whitespace differences)
    const roomGroups = {};
    userRows.forEach((r) => {
      const roomNo = (r.room_no || "").trim();
      if (!roomNo) return; // Skip if no room number
      if (!roomGroups[roomNo]) {
        roomGroups[roomNo] = [];
      }
      roomGroups[roomNo].push(r);
    });

    // Sort room groups by room number
    const sortedRoomNos = Object.keys(roomGroups).sort();

    const processedRows = [];

    // Process each room group
    sortedRoomNos.forEach((roomNo) => {
      const groupRows = roomGroups[roomNo];

      // Sort users within each room by name
      const sortedGroupRows = [...groupRows].sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      sortedGroupRows.forEach((r, index) => {
        const isFirstInGroup = index === 0;
        const userNo = index + 1;

        processedRows.push({
          key: r.user_id || `room-${roomNo}-${index}`,
          ...r,
          // Show each user's own dates, but room_no only on first row
          display_joined_date: r.joined_date || null,
          display_vacated_date: r.vacated_date || null,
          display_room_no: isFirstInGroup ? roomNo : null,
          user_no: userNo,
          _isFirstInRoom: isFirstInGroup,
        });
      });
    });

    return processedRows;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchUserSummary({ active_only: true });
      // Debug: Log first few users to check paid amount data
      console.log('Raw data from API (first 3 users):', data.slice(0, 3).map(u => ({
        name: u.name,
        user_id: u.user_id,
        total_paid_amount: u.total_paid_amount
      })));
      const processed = processRowsForDisplay(data);
      // Debug: Log processed rows
      console.log('Processed rows (first 3):', processed.slice(0, 3).map(r => ({
        name: r.name,
        user_id: r.user_id,
        total_paid_amount: r.total_paid_amount
      })));
      setRows(processed);
      // Reset to first page when data is reloaded
      setPagination((prev) => ({ ...prev, current: 1 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportXlsx = async () => {
    setExportLoadingXlsx(true);
    try {
      const cleaned = prepareExportData(rows);
      const ws = XLSX.utils.json_to_sheet(cleaned);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "UserSummary");
      XLSX.writeFile(wb, `user_summary_${Date.now()}.xlsx`);
    } finally {
      setExportLoadingXlsx(false);
    }
  };

  const exportCsv = async () => {
    setExportLoadingCsv(true);
    try {
      const cleaned = prepareExportData(rows);
      const ws = XLSX.utils.json_to_sheet(cleaned);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user_summary_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportLoadingCsv(false);
    }
  };

  return (
    <div className="p-3">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>
          Reports
        </Title>

        <Card size="small">
          <Space wrap>
            <Button onClick={load} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" onClick={exportXlsx} loading={exportLoadingXlsx} disabled={loading || rows.length === 0}>
              Export XLSX
            </Button>
            <Button onClick={exportCsv} loading={exportLoadingCsv} disabled={loading || rows.length === 0}>
              Export CSV
            </Button>
          </Space>
        </Card>

        <Card>
          <Table
            size="small"
            loading={loading}
            columns={columns}
            dataSource={rows}
            bordered
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              onChange: (page, pageSize) => {
                setPagination({
                  current: page,
                  pageSize: pageSize,
                });
              },
              onShowSizeChange: (current, size) => {
                setPagination({
                  current: 1, // Reset to first page when changing page size
                  pageSize: size,
                });
              },
            }}
            scroll={{ x: true }}
            style={{
              border: '1px solid #d9d9d9',
            }}
            components={{
              header: {
                cell: (props) => (
                  <th
                    {...props}
                    style={{
                      ...props.style,
                      borderRight: '1px solid #d9d9d9',
                      borderBottom: '1px solid #d9d9d9',
                    }}
                  />
                ),
              },
              body: {
                cell: (props) => (
                  <td
                    {...props}
                    style={{
                      ...props.style,
                      borderRight: '1px solid #d9d9d9',
                    }}
                  />
                ),
              },
            }}
          />
        </Card>
      </Space>
    </div>
  );
};

export default ReportsPage;
