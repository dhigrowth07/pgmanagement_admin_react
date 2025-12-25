import React, { useState, useMemo } from "react";
import { Table, Button, Tag, Dropdown, Menu } from "antd";
import { EyeOutlined, CheckCircleOutlined, EllipsisOutlined, DollarOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { markShareAsPaid, fetchUserBills } from "../../../redux/electricity/electricitySlice";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const PaymentTable = ({ payments, loading, onProcess, onView, onDelete, onCreateManual, tariffs = [], userElectricityBills = {}, onEBMarkedAsPaid }) => {
  const dispatch = useDispatch();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [markingPaid, setMarkingPaid] = useState({});

  const handleTableChange = (paginationInfo) => {
    setPagination(paginationInfo);
  };

  const handleMarkEBAsPaid = async (record) => {
    const userId = record.user_id;
    const bills = userElectricityBills[userId] || [];
    const unpaidBills = bills.filter((b) => !b.paid && (b.share_id || b.id));

    if (unpaidBills.length === 0) {
      toast.error("No unpaid electricity bills found for this user");
      return;
    }

    setMarkingPaid((prev) => ({ ...prev, [userId]: true }));

    try {
      // Mark all unpaid shares as paid
      const promises = unpaidBills.map((bill) => {
        const shareId = bill.share_id || bill.id;
        return dispatch(markShareAsPaid(shareId));
      });

      await Promise.all(promises);

      // Refresh user bills
      await dispatch(fetchUserBills(userId));

      // Notify parent to refresh payments and statistics
      if (onEBMarkedAsPaid) {
        onEBMarkedAsPaid();
      }

      toast.success(`Successfully marked ${unpaidBills.length} electricity bill(s) as paid`);
    } catch (error) {
      console.error("Error marking EB as paid:", error);
      toast.error("Failed to mark some electricity bills as paid");
    } finally {
      setMarkingPaid((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const getMenuItems = (record) => {
    const { calculatedStatus } = getChargeBreakdown(record);
    const userId = record.user_id;
    const bills = userElectricityBills[userId] || [];
    const unpaidBills = bills.filter((b) => !b.paid && (b.share_id || b.id));
    const hasUnpaidEB = unpaidBills.length > 0;
    const isMarkingPaid = markingPaid[userId] || false;

    return (
      <Menu>
        <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => onView(record)}>
          View Details
        </Menu.Item>
        {onCreateManual && (
          <Menu.Item key="manualPayment" icon={<DollarOutlined />} onClick={() => onCreateManual(record)}>
            Add Manual Payment
          </Menu.Item>
        )}
        {calculatedStatus === "due" && (
          <Menu.Item key="process" icon={<CheckCircleOutlined />} onClick={() => onProcess(record)}>
            Process Payment
          </Menu.Item>
        )}
        {hasUnpaidEB && (
          <>
            <Menu.Divider />
            <Menu.Item key="markEBPaid" icon={<DollarOutlined />} onClick={() => handleMarkEBAsPaid(record)} disabled={isMarkingPaid}>
              {isMarkingPaid ? "Marking as Paid..." : `Mark as Paid EB (${unpaidBills.length})`}
            </Menu.Item>
          </>
        )}
        <Menu.Divider />
        {/* <Menu.Item key="delete" icon={<DeleteOutlined />} danger onClick={() => onDelete(record)}>
          Delete Record
        </Menu.Item> */}
      </Menu>
    );
  };

  const tariffLookup = useMemo(() => {
    return tariffs.reduce((acc, tariff) => {
      acc[tariff.tariff_id] = tariff;
      return acc;
    }, {});
  }, [tariffs]);

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

  const getUnpaidElectricityAmount = (userId) => {
    const bills = userElectricityBills[userId] || [];
    if (!bills || bills.length === 0) {
      return 0;
    }
    // Calculate total unpaid electricity bill amount
    const unpaid = bills.filter((b) => !b.paid).reduce((sum, bill) => sum + parseFloat(bill.share_amount || 0), 0);
    return unpaid;
  };

  const getPaidElectricityAmount = (userId) => {
    const bills = userElectricityBills[userId] || [];
    if (!bills || bills.length === 0) {
      return 0;
    }
    // Calculate total paid electricity bill amount
    const paid = bills.filter((b) => b.paid).reduce((sum, bill) => sum + parseFloat(bill.share_amount || 0), 0);
    return paid;
  };

  const getTotalElectricityAmount = (userId) => {
    const bills = userElectricityBills[userId] || [];
    if (!bills || bills.length === 0) {
      return 0;
    }
    // Calculate total electricity bill amount (paid + unpaid)
    const total = bills.reduce((sum, bill) => sum + parseFloat(bill.share_amount || 0), 0);
    return total;
  };

  const isAllEBPaid = (userId) => {
    const bills = userElectricityBills[userId] || [];
    if (!bills || bills.length === 0) {
      return true; // No bills means nothing to pay
    }
    // Check if all bills are paid
    return bills.every((b) => b.paid);
  };

  const getChargeBreakdown = (record) => {
    const tariff = tariffLookup[record.tariff_id] || {};
    // Use fixed_fee and variable_fee directly from payment record (sent by backend)
    // Fall back to tariff lookup for backward compatibility
    const rentBase = Number(record.fixed_fee ?? tariff.fixed_fee ?? 0);
    // For rent, use fixed_fee from record/tariff if available, otherwise use amount_due (calculated from current tariff)
    // Note: stored_amount_due is the remaining balance after payments, not the original rent amount
    const rent = rentBase > 0 ? rentBase : record.rent || Number(record.amount_due ?? 0);

    // Get electricity amounts (only actual electricity bills, not variable_fee)
    const unpaidEBAmount = getUnpaidElectricityAmount(record.user_id);
    const paidEBAmount = getPaidElectricityAmount(record.user_id);
    const totalEBAmount = getTotalElectricityAmount(record.user_id);

    // Use eb_amount from API - backend correctly matches bills by payment month
    // Backend query: eb.month = TO_CHAR(payment_cycle_start_date, 'YYYY-MM')
    // This ensures each payment shows the correct EB bill for its specific month
    const ebAmountFromApi = record.eb_amount !== undefined ? Number(record.eb_amount || 0) : undefined;

    // Prioritize API value (correctly filtered by payment month)
    // Fallback to frontend calculation only if API value not available
    const ebDisplay = ebAmountFromApi !== undefined ? ebAmountFromApi : unpaidEBAmount > 0 ? unpaidEBAmount : totalEBAmount > 0 ? totalEBAmount : 0;

    // For total calculation: use API value (unpaid amount for this payment month)
    // If API returns 0, check if there's a paid bill to show in total
    const ebTotal = ebAmountFromApi !== undefined ? ebAmountFromApi : totalEBAmount > 0 ? totalEBAmount : 0;

    // Get variable_fee from payment record (sent by backend) or tariff lookup (fallback)
    // This represents the base electricity/utility charge
    const variableFee = Number(record.variable_fee ?? tariff.variable_fee ?? 0);

    // Calculate total: rent (fixed_fee) + variable_fee + actual electricity bills
    // This matches the backend's amount_due which includes fixed_fee + variable_fee
    // The backend balance_payable_amount includes both fixed_fee and variable_fee, so our total should too
    const total = rent + variableFee + ebTotal;

    // Use balance_payable_amount from API for remaining balance (most accurate)
    // This field correctly shows 0 for paid payments and actual remaining for due payments
    const rentRemainingFromApi = Number(record.balance_payable_amount ?? 0);

    // Use balance_payable_amount from API + unpaid EB for remaining
    // Use API eb_amount if available (correctly filtered by payment month), otherwise use frontend calculation
    const unpaidEBForRemaining = ebAmountFromApi !== undefined ? ebAmountFromApi : unpaidEBAmount;
    const remaining = rentRemainingFromApi + unpaidEBForRemaining;

    // Calculate total paid amount: Total Amount - Remaining Amount
    // This is the correct and simplest way to calculate paid amount
    // For due payments: totalPaid = total - remaining
    // For paid payments: totalPaid = total (since remaining is 0)
    const totalPaid = total - remaining;

    // Calculate rent portion of paid amount proportionally (for display purposes)
    // This shows how much of the rent portion (fixed_fee) was paid
    const totalBaseAmount = rent + variableFee; // fixed_fee + variable_fee
    const totalRentAndVariablePaid = totalBaseAmount - rentRemainingFromApi;
    const rentPaid = totalBaseAmount > 0 ? (rent / totalBaseAmount) * totalRentAndVariablePaid : 0;

    // Status: use API status if available, otherwise calculate based on remaining
    // If balance_payable_amount is 0 and no unpaid EB, status is paid
    const unpaidEBForStatus = ebAmountFromApi !== undefined ? ebAmountFromApi : unpaidEBAmount;
    const calculatedStatus = (rentRemainingFromApi === 0 && unpaidEBForStatus === 0) || record.status === "paid" ? "paid" : "due";

    return { rent, eb: ebDisplay, ebTotal, total, paid: totalPaid, remaining, calculatedStatus, rentPaid, paidEBAmount };
  };

  const columns = [
    {
      title: "Customer",
      dataIndex: "email",
      key: "customer",
      render: (email, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name || "N/A"}</div>
          <div style={{ fontSize: "12px", color: "#8c8c8c" }}>{email}</div>
        </div>
      ),
    },
    {
      title: "Rent",
      key: "rent",
      render: (_, record) => {
        const { rent } = getChargeBreakdown(record);
        return <span>{formatCurrency(rent)}</span>;
      },
    },
    {
      title: "Variable Fee",
      key: "variableFee",
      render: (_, record) => {
        const tariff = tariffLookup[record.tariff_id] || {};
        const variableFee = Number(record.variable_fee ?? tariff.variable_fee ?? 0);
        return <span>{formatCurrency(variableFee)}</span>;
      },
    },
    {
      title: "EB Bill",
      key: "eb",
      render: (_, record) => {
        // Use the value from getChargeBreakdown which prioritizes API eb_amount
        const { eb: ebDisplay } = getChargeBreakdown(record);
        const ebAmount = ebDisplay;
        const hasEBAmount = ebAmount > 0;

        // Check if EB is paid for this payment month
        // If API returns 0, it means no unpaid bill for this month (either paid or doesn't exist)
        const ebAmountFromApi = record.eb_amount !== undefined ? Number(record.eb_amount || 0) : undefined;
        const totalEBAmount = getTotalElectricityAmount(record.user_id);
        const isPaid = ebAmountFromApi !== undefined && ebAmountFromApi === 0 && totalEBAmount > 0;

        return (
          <span
            style={{
              fontWeight: hasEBAmount ? "bold" : "normal",
              color: isPaid ? "#52c41a" : hasEBAmount ? "#ff4d4f" : "inherit",
              backgroundColor: isPaid ? "#f6ffed" : hasEBAmount ? "#fff1f0" : "transparent",
              padding: hasEBAmount ? "2px 6px" : "0",
              borderRadius: hasEBAmount ? "4px" : "0",
            }}
          >
            {formatCurrency(ebAmount)}
          </span>
        );
      },
    },
    {
      title: "Total Amount",
      key: "total",
      render: (_, record) => {
        const { total } = getChargeBreakdown(record);
        return <span style={{ fontWeight: "bold" }}>{formatCurrency(total)}</span>;
      },
      sorter: (a, b) => {
        const totalA = getChargeBreakdown(a);
        const totalB = getChargeBreakdown(b);
        return totalA.total - totalB.total;
      },
    },
    {
      title: "Paid Amount",
      key: "paidAmount",
      render: (_, record) => {
        const { paid } = getChargeBreakdown(record);
        return <span>{formatCurrency(paid)}</span>;
      },
    },
    {
      title: "Remaining Amount",
      key: "remainingAmount",
      render: (_, record) => {
        const { remaining } = getChargeBreakdown(record);
        return (
          <Tag color={remaining > 0 ? "error" : "success"} style={{ margin: 0 }}>
            {formatCurrency(remaining)}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const { calculatedStatus } = getChargeBreakdown(record);
        // Use calculated status if remaining is 0, otherwise use record status
        const displayStatus = calculatedStatus;
        let color = displayStatus === "paid" ? "success" : "error";
        return <Tag color={color}>{displayStatus.toUpperCase()}</Tag>;
      },
      filters: [
        { text: "Paid", value: "paid" },
        { text: "Due", value: "due" },
      ],
      onFilter: (value, record) => {
        const { calculatedStatus } = getChargeBreakdown(record);
        return calculatedStatus === value;
      },
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (date) => dayjs(date).format("DD MMM, YYYY"),
      sorter: (a, b) => dayjs(a.due_date).unix() - dayjs(b.due_date).unix(),
    },
    {
      title: "Last Paid",
      dataIndex: "payment_date",
      key: "payment_date",
      render: (date) => (date ? dayjs(date).format("DD MMM, YYYY") : <Tag color="default">Not Paid</Tag>),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
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
      dataSource={payments}
      loading={loading}
      rowKey="payment_id"
      pagination={{
        ...pagination,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
      }}
      scroll={{ x: "max-content" }}
      onChange={handleTableChange}
    />
  );
};

export default PaymentTable;
