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

  if (loading) return <div>Loading...</div>;

  const handleExpenseAdded = (newExpense) => {
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const handleExpenseUpdated = (updatedExpense) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e))
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

  const tableStyle = {
    borderCollapse: "collapse",
    width: "100%",
    fontSize: "14px",
  };

  const tableHeaderStyle = {
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "2px solid #e0e0e0",
    color: "#888",
    fontWeight: "600",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const tableCellStyle = {
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "1px solid #f0f0f0",
    color: "#444",
  };

  const buttonStyle = (id) => ({
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: "12px",
    backgroundColor: hoveredButton === id ? "#333" : "white",
    color: hoveredButton === id ? "white" : "#333",
    transition: "all 0.2s",
  });

  return (
    <div style={{ padding: "20px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        <ExpenseForm
          onExpenseAdded={handleExpenseAdded}
          onExpenseUpdated={handleExpenseUpdated}
          editingExpense={editingExpense}
          onCancelEdit={()=> setEditingExpense(null)}
        />
      </div>
      <div style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h2 style={{ fontSize: "16px", color: "#333", marginBottom: "16px", fontWeight: "600" }}>
          Expenses
        </h2>
        <table style={tableStyle}>
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
                <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#aaa" }}>
                  No expenses yet. Add one above!
                </td>
              </tr>
            ) : (
              expenses.map((expense, index) => (
                <tr key={expense.id} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={tableCellStyle}>{expense.description}</td>
                  <td style={tableCellStyle}>Rs. {expense.amount}</td>
                  <td style={tableCellStyle}>{expense.date}</td>
                  <td style={tableCellStyle}>{expense.categories?.name || "Uncategorized"}</td>
                  <td style={tableCellStyle}>{expense.tags?.join(", ")}</td>
                  <td style={tableCellStyle}>
                    <button
                      style={buttonStyle(`edit-${expense.id}`)}
                      onMouseEnter={() => setHoveredButton(`edit-${expense.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      onClick={() => setEditingExpense(expense)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      style={buttonStyle(`delete-${expense.id}`)}
                      onMouseEnter={() => setHoveredButton(`delete-${expense.id}`)}
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
  );
}

export default Expenses;