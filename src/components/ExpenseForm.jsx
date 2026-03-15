import React, { useState, useEffect } from "react";
import {
  addExpense,
  getCategories,
  updateExpense,
} from "../helper/expenseUtils";
const initialFormData = {
  description: "",
  amount: "",
  date: "",
  category_id: "",
  tags: "",
};
function ExpenseForm({ onExpenseAdded, editingExpense, onExpenseUpdated }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);

  //Fetching categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        console.log("Fetched categories:", data);
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  //Updating expense
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
        console.log("Error updating expense", error);
      }
    }
  }, [editingExpense]);

  if (loading) return <div>Loading .....</div>;
  // if (categories.length === 0) return <div>No categories available</div>;

  //Submit Expense
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingExpense) {
      try {
        const data = await updateExpense(editingExpense.id, {
          ...formData,
          tags: formData.tags.split(",").map((tag) => tag.trim()),
        });
        onExpenseUpdated(data);
        console.log("Expense Updated: ");
      } catch (error) {
        console.error("Error updating expense", error);
      }
    } else {
      try {
        const data = await addExpense({
          ...formData,
          tags: formData.tags.split(",").map((tag) => tag.trim()),
        });
        console.log("Expense added:", data);
        onExpenseAdded(data);
        setFormData(initialFormData);
      } catch (error) {
        console.error("Failed to add expense:", error);
      }
    }
  };

  //styles
  const inputboxstyle = {
    margin: "10px",
    width: "50%",
    height: "30px",
    border: "1px solid #ccc",
    borderRadius: 10,
    textAlign: "center",
  };
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid white",
        borderRadius: "15px",
        margin: "4px",
        padding: "10px",
      }}
    >
      <form onSubmit={handleSubmit}>
        <h1>Add Your Expense</h1>
        <input
          name="description"
          placeholder="Enter Description"
          style={inputboxstyle}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, [e.target.name]: e.target.value })
          }
        />

        <input
          name="amount"
          placeholder="Enter Expense Amount"
          style={inputboxstyle}
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, [e.target.name]: e.target.value })
          }
        />
        <input
          type="date"
          name="date"
          placehodler="Select Date"
          style={inputboxstyle}
          value={formData.date}
          onChange={(e) =>
            setFormData({ ...formData, [e.target.name]: e.target.value })
          }
        />
        <select
          name="category_id"
          style={inputboxstyle}
          value={formData.category_id}
          onChange={(e) =>
            setFormData({ ...formData, [e.target.name]: e.target.value })
          }
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
          style={inputboxstyle}
          value={formData.tags}
          placeholder="Enter tags separated by commas"
          onChange={(e) =>
            setFormData({ ...formData, [e.target.name]: e.target.value })
          }
        />
        <button type="submit" className="primary-btn">
          {editingExpense ? "Edit Expense" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;
