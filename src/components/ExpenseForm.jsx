import React, { useState, useEffect } from "react";
import { addExpense, getCategories, updateExpense } from "../helper/expenseUtils";

const initialFormData = {
  description: "",
  amount: "",
  date: "",
  category_id: "",
  tags: "",
};

function ExpenseForm({ onExpenseAdded, editingExpense, onExpenseUpdated, onCancelEdit }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingExpense) {
      try {
        setFormData({
          description: editingExpense.description,
          amount: editingExpense.amount,
          date: editingExpense.date,
          category_id: editingExpense.category_id,
          tags: editingExpense.tags.join(", "),
        });
      } catch (error) {
        console.log("Error setting form data", error);
      }
    } else {
      setFormData(initialFormData);
    }
  }, [editingExpense]);

  if (loading) return <div style={{ padding: "16px" }}>Loading.....</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingExpense) {
      try {
        const data = await updateExpense(editingExpense.id, {
          ...formData,
          tags: formData.tags.split(",").map((tag) => tag.trim()),
        });
        onExpenseUpdated(data);
      } catch (error) {
        console.error("Error updating expense", error);
      }
    } else {
      try {
        const data = await addExpense({
          ...formData,
          tags: formData.tags.split(",").map((tag) => tag.trim()),
        });
        onExpenseAdded(data);
        setFormData(initialFormData);
      } catch (error) {
        console.error("Failed to add expense:", error);
      }
    }
  };

  const inputStyle = {
    display: "block",
    margin: "8px auto",
    width: "100%",
    height: "40px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "0 12px",
    fontSize: "14px",
    color: "#333",
    backgroundColor: "#fafafa",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "20px",
      width: "100%",
      maxWidth: "480px",   // caps width on desktop
      boxSizing: "border-box",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <form onSubmit={handleSubmit}>
        <h1 style={{
          textAlign: "center",
          fontSize: "16px",
          marginBottom: "16px",
          color: "#333",
          fontWeight: "600",
          margin: "0 0 16px 0",
        }}>
          {editingExpense ? "Edit Expense" : "Add Expense"}
        </h1>

        <input
          name="description"
          placeholder="Enter Description"
          style={inputStyle}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        />
        <input
          name="amount"
          placeholder="Enter Amount"
          style={inputStyle}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        />
        <input
          type="date"
          name="date"
          style={inputStyle}
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        />
        <select
          name="category_id"
          style={inputStyle}
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="tags"
          style={inputStyle}
          value={formData.tags}
          placeholder="Enter tags separated by commas"
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        />

        <button
          type="submit"
          style={{
            display: "block",
            margin: "16px 0 0",
            width: "100%",
            height: "42px",
            backgroundColor: "#333",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "600",
            boxSizing: "border-box",
          }}
        >
          {editingExpense ? "Update Expense" : "Add Expense"}
        </button>

        {editingExpense && (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              display: "block",
              margin: "8px 0 0",
              width: "100%",
              height: "42px",
              backgroundColor: "white",
              color: "#333",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "600",
              boxSizing: "border-box",
            }}
          >
            Cancel
          </button>
        )}
      </form>
    </div>
  );
}

export default ExpenseForm;