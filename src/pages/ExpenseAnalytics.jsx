import { useEffect, useState } from "react";
import { getExpenses } from "../helper/expenseUtils";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { ScatterChart } from "@mui/x-charts/ScatterChart";

const ExpenseAnalytics = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [chartWidth, setChartWidth] = useState(window.innerWidth - 80);

  // Update chart width when window resizes
  useEffect(() => {
    const handleResize = () => setChartWidth(window.innerWidth - 80);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const data = await getExpenses();
        setExpenses(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching expenses", error);
      }
    };
    fetchExpense();
  }, []);

  const getFilteredExpenses = () => {
    const now = new Date();
    if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return expenses.filter((e) => new Date(e.date) >= weekAgo);
    }
    if (filter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return expenses.filter((e) => new Date(e.date) >= monthAgo);
    }
    return expenses;
  };

  const filteredExpenses = getFilteredExpenses();

  const groupByCategory = (data) => {
    const grouped = data.reduce((acc, expense) => {
      const categoryName = expense.categories?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = { category: categoryName, total: 0, count: 0 };
      }
      acc[categoryName].total += Number(expense.amount);
      acc[categoryName].count += 1;
      return acc;
    }, {});
    return Object.values(grouped);
  };

  const chartData = groupByCategory(filteredExpenses);

  const maxCategory = chartData.reduce(
    (max, item) => (item.total > max.total ? item : max),
    { total: 0 },
  );

  const pieData = chartData.map((item, index) => ({
    id: index,
    value: item.total,
    label: item.category,
  }));

  const scatterData = filteredExpenses.map((expense) => ({
    x: new Date(expense.date).getTime(),
    y: Number(expense.amount),
    id: expense.id,
  }));

  if (loading) return <div style={{ padding: "20px" }}>Loading.....</div>;

  const sectionStyle = {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "16px",
  };

  const filterBtnStyle = (value) => ({
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: filter === value ? "#333" : "white",
    color: filter === value ? "white" : "#333",
    transition: "all 0.2s",
  });

  const tableHeaderStyle = {
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "2px solid #e0e0e0",
    color: "#888",
    fontWeight: "600",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  };

  const tableCellStyle = {
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "1px solid #f0f0f0",
    color: "#444",
    fontSize: "13px",
  };

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <h1
        style={{
          fontSize: "18px",
          color: "#333",
          fontWeight: "600",
          margin: "0 0 16px 0",
        }}
      >
        Expense Analytics
      </h1>

      {/* Filter Buttons */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button style={filterBtnStyle("all")} onClick={() => setFilter("all")}>
          All Time
        </button>
        <button
          style={filterBtnStyle("month")}
          onClick={() => setFilter("month")}
        >
          This Month
        </button>
        <button
          style={filterBtnStyle("week")}
          onClick={() => setFilter("week")}
        >
          This Week
        </button>
      </div>

      {/* Summary Cards — stack on mobile */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {[
          { label: "Total Expenses", value: filteredExpenses.length },
          {
            label: "Total Amount",
            value: `Rs. ${filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()}`,
          },
          {
            label: "Highest Spending",
            value: maxCategory.category || "N/A",
            sub: `Rs. ${maxCategory.total?.toLocaleString() || 0}`,
          },
          { label: "Categories", value: chartData.length },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <p
              style={{
                color: "#888",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: 0,
              }}
            >
              {card.label}
            </p>
            <h2
              style={{
                color: "#333",
                fontSize: "20px",
                margin: "6px 0 0",
                fontWeight: "700",
                wordBreak: "break-word",
              }}
            >
              {card.value}
            </h2>
            {card.sub && (
              <p style={{ color: "#888", fontSize: "11px", margin: "4px 0 0" }}>
                {card.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "15px",
            color: "#333",
            marginBottom: "16px",
            fontWeight: "600",
            margin: "0 0 16px 0",
          }}
        >
          Spending by Category
        </h2>
        {chartData.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>
            No data for this period
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <BarChart
              xAxis={[
                { scaleType: "band", data: chartData.map((d) => d.category) },
              ]}
              series={[
                {
                  data: chartData.map((d) => d.total),
                  label: "Total (Rs.)",
                  color: "#333",
                },
              ]}
              width={Math.max(chartWidth, 300)}
              height={260}
            />
          </div>
        )}
      </div>

      {/* Pie Chart */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "15px",
            color: "#333",
            fontWeight: "600",
            margin: "0 0 16px 0",
          }}
        >
          Spending Distribution
        </h2>
        {pieData.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>
            No data for this period
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <PieChart
              series={[
                {
                  data: pieData,
                  highlightScope: { faded: "global", highlighted: "item" },
                  innerRadius: 40,
                  outerRadius: 100,
                  paddingAngle: 3,
                  cornerRadius: 4,
                },
              ]}
              width={Math.max(chartWidth, 300)}
              height={260}
            />
          </div>
        )}
      </div>

      {/* Scatter Chart */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "15px",
            color: "#333",
            fontWeight: "600",
            margin: "0 0 4px 0",
          }}
        >
          Expenses Over Time
        </h2>
        <p style={{ color: "#888", fontSize: "12px", margin: "0 0 16px 0" }}>
          Each dot is one expense
        </p>
        {scatterData.length === 0 ? (
          <p style={{ color: "#aaa", textAlign: "center" }}>
            No data for this period
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <ScatterChart
              series={[{ data: scatterData, label: "Expense", color: "#333" }]}
              xAxis={[
                {
                  label: "Date",
                  valueFormatter: (value) =>
                    new Date(value).toLocaleDateString(),
                },
              ]}
              yAxis={[{ label: "Amount (Rs.)" }]}
              width={Math.max(chartWidth, 300)}
              height={260}
            />
          </div>
        )}
      </div>

      {/* Category Breakdown Table */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: "15px",
            color: "#333",
            fontWeight: "600",
            margin: "0 0 16px 0",
          }}
        >
          Category Breakdown
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr>
                {["Category", "Count", "Total Amount"].map((header) => (
                  <th key={header} style={tableHeaderStyle}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      color: "#aaa",
                    }}
                  >
                    No expenses for this period
                  </td>
                </tr>
              ) : (
                chartData.map((item, index) => (
                  <tr
                    key={item.category}
                    style={{
                      backgroundColor:
                        item.category === maxCategory.category
                          ? "#fff8f0"
                          : index % 2 === 0
                            ? "#fff"
                            : "#fafafa",
                    }}
                  >
                    <td style={tableCellStyle}>
                      {item.category}
                      {item.category === maxCategory.category && (
                        <span
                          style={{
                            marginLeft: "6px",
                            backgroundColor: "#ff9800",
                            color: "white",
                            fontSize: "9px",
                            padding: "2px 5px",
                            borderRadius: "4px",
                            fontWeight: "600",
                          }}
                        >
                          TOP
                        </span>
                      )}
                    </td>
                    <td style={tableCellStyle}>{item.count}</td>
                    <td style={tableCellStyle}>
                      Rs. {item.total.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalytics;
