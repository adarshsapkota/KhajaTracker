import React, { useEffect, useState } from "react";
import { useLunchApp } from "../context/LunchContext";
import {
  formatCurrency,
  getReceivablesByMember,
  getTodayDateString,
} from "../helper/lunchUtils";

function Receivables() {
  const { records, payments, addPayment, clearPayments, clearRecords } = useLunchApp();
  const receivables = getReceivablesByMember(records, payments);
  const [date, setDate] = useState(getTodayDateString());
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!receivables.members.length) {
      setMemberId("");
      return;
    }
    setMemberId((prev) =>
      prev && receivables.members.some((member) => member.id === prev)
        ? prev
        : receivables.members[0].id
    );
  }, [receivables.members]);

  const handleClearReceived = () => {
    const confirmed = window.confirm(
      "Clear all expense records and received payment history? Members will be kept."
    );
    if (!confirmed) return;
    clearRecords();
  };

  const handleRecordPayment = (event) => {
    event.preventDefault();
    const result = addPayment({
      date,
      memberId,
      amount,
      note,
    });
    setMessage(result.message || (result.ok ? "Payment recorded" : ""));
    if (!result.ok) return;
    setAmount("");
    setNote("");
  };

  const handleClearPaymentHistory = () => {
    const confirmed = window.confirm("Clear all received payment history?");
    if (!confirmed) return;
    clearPayments();
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <h1>Receivables</h1>
        <p>
          Assuming you are the payer in recorded lunches, this shows how much each
          member still owes you.
        </p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="muted">Total to receive</span>
          <h3>{formatCurrency(receivables.total)}</h3>
          <small>{receivables.members.length} members with pending amount</small>
        </div>
        <div className="card">
          <div className="section-title-row">
            <h2>Actions</h2>
          </div>
          <p className="muted">
            You can clear partial dues per person below, or clear all records when done.
          </p>
          <button
            type="button"
            className="danger-btn"
            onClick={handleClearReceived}
            disabled={records.length === 0}
          >
            Clear Expenses + Payments
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={handleClearPaymentHistory}
            disabled={payments.length === 0}
          >
            Clear Payment History
          </button>
        </div>
      </div>

      <section className="card">
        <div className="section-title-row">
          <h2>Record Received Amount</h2>
        </div>
        <form className="form-grid" onSubmit={handleRecordPayment}>
          {message ? <p className="form-message">{message}</p> : null}
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Member
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Select member</option>
              {receivables.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({formatCurrency(member.amount)} pending)
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount received
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="full-width">
            Note (optional)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Partial payment, UPI ref, etc."
            />
          </label>
          <button type="submit" className="primary-btn" disabled={!receivables.members.length}>
            Save Received Amount
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Member-wise Due</h2>
        </div>
        {receivables.members.length === 0 ? (
          <p className="empty-state">
            No pending receivables. Record lunch bills first, or all dues are settled.
          </p>
        ) : (
          <div className="member-list">
            {receivables.members.map((member) => (
              <div key={member.id} className="member-item">
                <strong>{member.name}</strong>
                <div>
                  <p className="muted">Due: {formatCurrency(member.grossAmount)}</p>
                  <p className="muted">Received: {formatCurrency(member.receivedAmount)}</p>
                  <strong className="amount-positive">
                    Pending: {formatCurrency(member.amount)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Recent Payments</h2>
        </div>
        {payments.length === 0 ? (
          <p className="empty-state">No payment history yet.</p>
        ) : (
          <div className="record-list">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="record-item">
                <div>
                  <strong>{payment.memberName}</strong>
                  <p className="muted">{payment.date}</p>
                  {payment.note ? <p className="muted">{payment.note}</p> : null}
                </div>
                <strong className="amount-positive">{formatCurrency(payment.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Receivables;
