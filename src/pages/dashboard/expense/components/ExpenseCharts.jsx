import React, { useMemo } from "react";
import { Card, Row, Col, Typography } from "antd";
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";

const { Title } = Typography;

const COLORS = ["#667eea", "#f093fb", "#4facfe", "#43e97b", "#fa709a", "#fee140", "#764ba2", "#f5576c"];

const ExpenseCharts = ({ summary, meta }) => {
  const formatCurrency = (amountCents) => {
    const amount = Number(amountCents || 0) / 100;
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Prepare daily spending data for line chart (last 30 days)
  const dailySpendingData = useMemo(() => {
    if (!summary?.byDay || summary.byDay.length === 0) return [];

    const thirtyDaysAgo = dayjs().subtract(30, "days");
    const dailyData = summary.byDay
      .filter((day) => dayjs(day.date).isAfter(thirtyDaysAgo) || dayjs(day.date).isSame(thirtyDaysAgo, "day"))
      .map((day) => ({
        date: dayjs(day.date).format("MMM DD"),
        amount: Number(day.amount_cents || 0) / 100,
        fullDate: day.date,
      }))
      .sort((a, b) => dayjs(a.fullDate).unix() - dayjs(b.fullDate).unix());

    // Fill in missing days with 0
    const result = [];
    const startDate = dayjs().subtract(30, "days");
    for (let i = 0; i < 30; i++) {
      const currentDate = startDate.add(i, "days");
      const existingData = dailyData.find((d) => dayjs(d.fullDate).isSame(currentDate, "day"));
      result.push({
        date: currentDate.format("MMM DD"),
        amount: existingData ? existingData.amount : 0,
        fullDate: currentDate.format("YYYY-MM-DD"),
      });
    }
    return result;
  }, [summary?.byDay]);

  // Prepare category breakdown data for pie chart
  const categoryData = useMemo(() => {
    if (!summary?.byCategory || summary.byCategory.length === 0) return [];
    return summary.byCategory
      .map((cat) => ({
        name: cat.name || "Uncategorized",
        value: Number(cat.amount_cents || 0) / 100,
        percentage: cat.percentage ? (cat.percentage * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [summary?.byCategory]);

  // Prepare monthly comparison data
  const monthlyData = useMemo(() => {
    if (!summary?.byDay || summary.byDay.length === 0) return [];

    const monthlyMap = {};
    summary.byDay.forEach((day) => {
      const monthKey = dayjs(day.date).format("MMM YYYY");
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = 0;
      }
      monthlyMap[monthKey] += Number(day.amount_cents || 0) / 100;
    });

    return Object.entries(monthlyMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => dayjs(a.month, "MMM YYYY").unix() - dayjs(b.month, "MMM YYYY").unix())
      .slice(-6); // Last 6 months
  }, [summary?.byDay]);

  // Calculate max value for Y-axis domain
  const maxDailyAmount = useMemo(() => {
    if (dailySpendingData.length === 0) return 0;
    return Math.max(...dailySpendingData.map((d) => d.amount));
  }, [dailySpendingData]);

  const maxMonthlyAmount = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    return Math.max(...monthlyData.map((d) => d.amount));
  }, [monthlyData]);

  // Calculate Y-axis ticks based on max value
  const calculateYTicks = (maxValue) => {
    if (maxValue === 0) return [0];

    // Round up to nearest nice number
    const niceMax = Math.ceil(maxValue * 1.1);
    const step = niceMax <= 1000 ? Math.ceil(niceMax / 5) : Math.ceil(niceMax / 5 / 100) * 100;

    const ticks = [];
    for (let i = 0; i <= niceMax; i += step) {
      ticks.push(i);
    }
    return ticks.length > 6 ? ticks.filter((_, idx) => idx % 2 === 0 || idx === ticks.length - 1) : ticks;
  };

  // Smart Y-axis formatter based on max value
  const getYAxisFormatter = (maxValue) => {
    return (value) => {
      if (maxValue >= 1000) {
        // For values >= 1000, use k format
        if (value >= 1000) {
          const kValue = value / 1000;
          // Show decimals only if needed (e.g., 1.5k, 2.5k)
          return kValue % 1 === 0 ? `₹${kValue.toFixed(0)}k` : `₹${kValue.toFixed(1)}k`;
        }
        return `₹${Math.round(value)}`;
      } else {
        // For small values, just show rupees
        return `₹${Math.round(value)}`;
      }
    };
  };

  const dailyYTicks = useMemo(() => calculateYTicks(maxDailyAmount), [maxDailyAmount]);
  const monthlyYTicks = useMemo(() => calculateYTicks(maxMonthlyAmount), [maxMonthlyAmount]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: "4px 0", color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value * 100)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CategoryTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>{data.name}</p>
          <p style={{ margin: "4px 0", color: data.color }}>{`Amount: ${formatCurrency(data.value * 100)}`}</p>
          <p style={{ margin: "4px 0", color: "#666" }}>{`${data.payload.percentage}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  if (!summary || (!summary.byDay && !summary.byCategory)) {
    return (
      <Card bordered={false} style={{ marginTop: 16 }}>
        <Title level={5}>No data available for charts</Title>
      </Card>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <Row gutter={[16, 16]}>
        {/* Daily Spending Trend - Line Chart */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={
              <Title level={5} style={{ margin: 0 }}>
                Daily Spending Trend (Last 30 Days)
              </Title>
            }
            style={{ borderRadius: 8 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySpendingData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={getYAxisFormatter(maxDailyAmount)}
                  label={{ value: "Amount (₹)", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                  domain={[0, maxDailyAmount > 0 ? Math.ceil(maxDailyAmount * 1.1) : 100]}
                  allowDecimals={false}
                  ticks={dailyYTicks}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#667eea" fillOpacity={1} fill="url(#colorAmount)" name="Daily Spending" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Category Breakdown - Pie Chart */}
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            title={
              <Title level={5} style={{ margin: 0 }}>
                Category Breakdown
              </Title>
            }
            style={{ borderRadius: 8 }}
          >
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percentage }) => `${name} (${percentage}%)`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>No category data available</div>
            )}
          </Card>
        </Col>

        {/* Monthly Comparison - Bar Chart */}
        {monthlyData.length > 0 && (
          <Col xs={24}>
            <Card
              bordered={false}
              title={
                <Title level={5} style={{ margin: 0 }}>
                  Monthly Spending Comparison
                </Title>
              }
              style={{ borderRadius: 8 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={getYAxisFormatter(maxMonthlyAmount)}
                    label={{ value: "Amount (₹)", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                    domain={[0, maxMonthlyAmount > 0 ? Math.ceil(maxMonthlyAmount * 1.1) : 100]}
                    allowDecimals={false}
                    ticks={monthlyYTicks}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#667eea" name="Monthly Spending" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ExpenseCharts;
