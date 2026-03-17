import React, { useState, useEffect } from "react";
import { getExpenses, deleteExpense } from "../helper/expenseUtils";
import ExpenseForm from "../components/ExpenseForm";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await getExpenses();
        setExpenses(data);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>Loading...</div>;

  const handleExpenseAdded = (newExpense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleExpenseUpdated = (updatedExpense) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e)),
    );
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

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

  const buttonStyle = (id) => ({
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "11px",
    backgroundColor: hoveredButton === id ? "#333" : "white",
    color: hoveredButton === id ? "white" : "#333",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  });

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* Page Title */}
      <h1
        style={{
          fontSize: "18px",
          color: "#333",
          fontWeight: "600",
          margin: "0 0 16px 0",
        }}
      >
        Expenses
      </h1>

      {/* Form — full width on mobile */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "500px" }}>
          <ExpenseForm
            onExpenseAdded={handleExpenseAdded}
            onExpenseUpdated={handleExpenseUpdated}
            editingExpense={editingExpense}
            onCancelEdit={() => setEditingExpense(null)}
          />
        </div>
      </div>

      {/* Summary Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
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
            Total Expenses
          </p>
          <h2
            style={{
              color: "#333",
              fontSize: "22px",
              margin: "6px 0 0",
              fontWeight: "700",
            }}
          >
            {expenses.length}
          </h2>
        </div>
        <div
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
            Total Amount
          </p>
          <h2
            style={{
              color: "#333",
              fontSize: "22px",
              margin: "6px 0 0",
              fontWeight: "700",
            }}
          >
            Rs.{" "}
            {expenses
              .reduce((sum, e) => sum + Number(e.amount), 0)
              .toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Expenses Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            fontSize: "15px",
            color: "#333",
            fontWeight: "600",
            margin: "0 0 16px 0",
          }}
        >
          All Expenses
        </h2>

        {/* Wrap table in scrollable div for mobile */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: "13px",
              minWidth: "500px", // prevents squishing on small screens
            }}
          >
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Description</th>
                <th style={tableHeaderStyle}>Amount</th>
                <th style={tableHeaderStyle}>Date</th>
                <th style={tableHeaderStyle}>Category</th>
                <th style={tableHeaderStyle}>Tags</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "#aaa",
                      fontSize: "14px",
                    }}
                  >
                    No expenses yet. Add one above!
                  </td>
                </tr>
              ) : (
                expenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <td style={tableCellStyle}>{expense.description}</td>
                    <td style={tableCellStyle}>Rs. {expense.amount}</td>
                    <td style={tableCellStyle}>{expense.date}</td>
                    <td style={tableCellStyle}>
                      {expense.categories?.name || "Uncategorized"}
                    </td>
                    <td style={tableCellStyle}>
                      {expense.tags?.join(", ") || "—"}
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        style={buttonStyle(`edit-${expense.id}`)}
                        onMouseEnter={() =>
                          setHoveredButton(`edit-${expense.id}`)
                        }
                        onMouseLeave={() => setHoveredButton(null)}
                        onClick={() => setEditingExpense(expense)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        style={buttonStyle(`delete-${expense.id}`)}
                        onMouseEnter={() =>
                          setHoveredButton(`delete-${expense.id}`)
                        }
                        onMouseLeave={() => setHoveredButton(null)}
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        Delete
                      </button>
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
}

export default Expenses;
