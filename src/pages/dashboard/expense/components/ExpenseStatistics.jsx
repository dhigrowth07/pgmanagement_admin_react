import React, { useMemo } from "react";
import { Card, Statistic, Tooltip } from "antd";
import { BadgeIndianRupee, TrendingUp, FolderOpen, Calendar, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import dayjs from "dayjs";

const ExpenseStatistics = ({ summary, meta }) => {
  const formatCurrency = (amountCents) => {
    const amount = Number(amountCents || 0) / 100;
    // Display without decimal places (e.g., ₹1,000 instead of ₹1,000.00)
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const totalAmount = summary?.totalAmountCents || 0;
  const totalCount = meta?.total_count || 0;
  const averageExpense = totalCount > 0 ? totalAmount / totalCount : 0;

  // Calculate this month's total
  const thisMonthTotal = useMemo(() => {
    if (!summary?.byDay || summary.byDay.length === 0) return 0;
    const currentMonth = dayjs().month();
    const currentYear = dayjs().year();
    return summary.byDay
      .filter((day) => {
        const dayDate = dayjs(day.date);
        return dayDate.month() === currentMonth && dayDate.year() === currentYear;
      })
      .reduce((sum, day) => sum + (day.amount_cents || 0), 0);
  }, [summary?.byDay]);

  // Calculate last 7 days total
  const last7DaysTotal = useMemo(() => {
    if (!summary?.byDay || summary.byDay.length === 0) return 0;
    const sevenDaysAgo = dayjs().subtract(7, "days");
    return summary.byDay
      .filter((day) => {
        const dayDate = dayjs(day.date);
        return dayDate.isAfter(sevenDaysAgo) || dayDate.isSame(sevenDaysAgo, "day");
      })
      .reduce((sum, day) => sum + (day.amount_cents || 0), 0);
  }, [summary?.byDay]);

  // Calculate last month's total for comparison
  const lastMonthTotal = useMemo(() => {
    if (!summary?.byDay || summary.byDay.length === 0) return 0;
    const lastMonth = dayjs().subtract(1, "month");
    return summary.byDay
      .filter((day) => {
        const dayDate = dayjs(day.date);
        return dayDate.month() === lastMonth.month() && dayDate.year() === lastMonth.year();
      })
      .reduce((sum, day) => sum + (day.amount_cents || 0), 0);
  }, [summary?.byDay]);

  // Calculate month-over-month growth
  const monthGrowth = useMemo(() => {
    if (lastMonthTotal === 0) return thisMonthTotal > 0 ? 100 : 0;
    return ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }, [thisMonthTotal, lastMonthTotal]);

  // Get top category
  const topCategory = useMemo(() => {
    if (!summary?.byCategory || summary.byCategory.length === 0) return null;
    return summary.byCategory.reduce((max, cat) => {
      return (cat.amount_cents || 0) > (max.amount_cents || 0) ? cat : max;
    }, summary.byCategory[0]);
  }, [summary?.byCategory]);

  // Get category percentage
  const topCategoryPercentage = topCategory && totalAmount > 0 ? ((topCategory.amount_cents / totalAmount) * 100).toFixed(1) : 0;

  const cardStyles = [
    {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      iconBg: "rgba(255, 255, 255, 0.2)",
      iconColor: "#ffffff",
    },
    {
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      iconBg: "rgba(255, 255, 255, 0.2)",
      iconColor: "#ffffff",
    },
    {
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      iconBg: "rgba(255, 255, 255, 0.2)",
      iconColor: "#ffffff",
    },
    {
      background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      iconBg: "rgba(255, 255, 255, 0.2)",
      iconColor: "#ffffff",
    },
    {
      background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      iconBg: "rgba(255, 255, 255, 0.2)",
      iconColor: "#ffffff",
    },
  ];

  const statCards = [
    {
      title: "Total Expenses",
      value: formatCurrency(totalAmount),
      subValue: `${totalCount} ${totalCount === 1 ? "expense" : "expenses"}`,
      icon: BadgeIndianRupee,
      style: cardStyles[0],
      tooltip: `Total of all expenses across all time`,
    },
    {
      title: "This Month",
      value: formatCurrency(thisMonthTotal),
      subValue: monthGrowth !== 0 && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          {monthGrowth > 0 ? <ArrowUpRight size={14} color="#52c41a" /> : <ArrowDownRight size={14} color="#ff4d4f" />}
          <span style={{ color: "#111", fontSize: 12 }}>
            {Math.abs(monthGrowth).toFixed(1)}% {monthGrowth > 0 ? "increase" : "decrease"}
          </span>
        </span>
      ),
      icon: Calendar,
      style: cardStyles[1],
      tooltip: `Spending this month compared to last month`,
    },
    {
      title: "Last 7 Days",
      value: formatCurrency(last7DaysTotal),
      subValue: `Daily avg: ${formatCurrency(last7DaysTotal / 7)}`,
      icon: Receipt,
      style: cardStyles[2],
      tooltip: `Total spending in the last 7 days`,
    },
    {
      title: "Top Category",
      value: topCategory ? topCategory.name : "N/A",
      subValue: topCategory ? (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{formatCurrency(topCategory.amount_cents)}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{topCategoryPercentage}% of total</div>
        </div>
      ) : (
        "No categories yet"
      ),
      icon: FolderOpen,
      style: cardStyles[3],
      tooltip: topCategory ? `${topCategory.name} accounts for ${topCategoryPercentage}% of total expenses` : "No category data available",
    },
    {
      title: "Average per Expense",
      value: formatCurrency(averageExpense),
      subValue: totalCount > 0 ? `${totalCount} expenses recorded` : "No expenses yet",
      icon: TrendingUp,
      style: cardStyles[4],
      tooltip: `Average amount per expense entry`,
    },
  ];

  return (
    <div className="grid grid-cols-1 mb-5 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((item, index) => (
        <Tooltip key={item.title} title={item.tooltip}>
          <Card
            bordered={false}
            className="shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              background: item.style.background,
              borderRadius: 12,
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginBottom: 8, fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#ffffff", marginBottom: 4, lineHeight: 1.2 }}>{item.value}</div>
                {item.subValue && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 8 }}>{item.subValue}</div>}
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 12,
                  background: item.style.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <item.icon size={20} color={item.style.iconColor} />
              </div>
            </div>
          </Card>
        </Tooltip>
      ))}
    </div>
  );
};

export default ExpenseStatistics;
