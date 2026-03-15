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

  if (loading) return <div>Loading ...</div>;

  const handleExpenseAdded = (newExpense) => {
    setExpenses((prevExpenses) => [newExpense, ...prevExpenses]);
  };
  const handleExpenseUpdated = (updatedExpense) => {
    setExpenses((prevExpenses) =>
      prevExpenses.map((expense) =>
        expense.id === updatedExpense.id ? updatedExpense : expense,
      ),
    );
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses((prevExpenses) =>
        prevExpenses.filter((expense) => expense.id !== id),
      );
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  const tableStyle = {
    border: "1px solid black",
    borderCollapse: "collapse",
    width: "100%",
  };

  const tableCellStyle = {
    border: "1px solid black",
    padding: "8px",
    textAlign: "left",
  };

  const buttonStyle = (id) => ({
    border: "1px solid black",
    borderRadius: "10px",
    padding: "4px 10px",
    cursor: "pointer",
    backgroundColor: hoveredButton === id ? "black" : "white",
    color: hoveredButton === id ? "white" : "black",
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ExpenseForm
          onExpenseAdded={handleExpenseAdded}
          onExpenseUpdated={handleExpenseUpdated}
          editingExpense={editingExpense}
        />
      </div>
      <div
        style={{
          backgroundColor: "white",
          border: "1px solid white",
          borderRadius: "15px",
          margin: "4px",
          padding: "10px",
        }}
      >
        <h1>Expenses</h1>
        <div>
          <div className="expense-info">
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableCellStyle}>Description</th>
                  <th style={tableCellStyle}>Amount</th>
                  <th style={tableCellStyle}>Date</th>
                  <th style={tableCellStyle}>Category</th>
                  <th style={tableCellStyle}>Tags</th>
                  <th style={tableCellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td style={tableCellStyle}>{expense.description}</td>
                    <td style={tableCellStyle}>{expense.amount}</td>
                    <td style={tableCellStyle}>{expense.date}</td>
                    <td style={tableCellStyle}>
                      {expense.categories?.name || "Uncategorized"}
                    </td>
                    <td style={tableCellStyle}>{expense.tags}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Expenses;
