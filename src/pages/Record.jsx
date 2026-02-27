import React, { useEffect, useState } from "react";
import { useLunchApp } from "../context/LunchContext";
import {
  formatCurrency,
  getShareTotal,
  getTodayDateString,
} from "../helper/lunchUtils";

function Record() {
  const { activeMembers, addRecord, records } = useLunchApp();
  const [date, setDate] = useState(getTodayDateString());
  const [description, setDescription] = useState("Office lunch");
  const [total, setTotal] = useState("");
  const [paidById, setPaidById] = useState("");
  const [participantIds, setParticipantIds] = useState([]);
  const [participantShares, setParticipantShares] = useState({});
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!activeMembers.length) {
      setPaidById("");
      setParticipantIds([]);
      setParticipantShares({});
      return;
    }

    setPaidById((prev) => prev || activeMembers[0].id);
    setParticipantIds((prev) => (prev.length ? prev : activeMembers.map((m) => m.id)));
  }, [activeMembers]);

  useEffect(() => {
    setParticipantShares((prev) => {
      const next = {};
      participantIds.forEach((id) => {
        next[id] = prev[id] ?? "";
      });
      return next;
    });
  }, [participantIds]);

  const toggleParticipant = (memberId) => {
    setParticipantIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleShareChange = (memberId, value) => {
    setParticipantShares((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const sharesTotal = getShareTotal(participantShares, participantIds);
    const result = addRecord({
      date,
      description,
      total: total.trim() ? total : sharesTotal,
      paidById,
      participantIds,
      participantShares,
      note,
    });

    setMessage(result.message || (result.ok ? "Lunch bill recorded" : ""));

    if (result.ok) {
      setTotal("");
      setNote("");
      setParticipantShares((prev) => {
        const next = {};
        Object.keys(prev).forEach((id) => {
          next[id] = "";
        });
        return next;
      });
    }
  };

  const selectedMembers = activeMembers.filter((member) =>
    participantIds.includes(member.id)
  );
  const sharesTotal = getShareTotal(participantShares, participantIds);
  const enteredTotal = total.trim() ? Number(total) || 0 : 0;
  const effectiveTotal = total.trim() ? enteredTotal : sharesTotal;
  const totalMatches = !total.trim() || Math.abs(enteredTotal - sharesTotal) <= 0.01;

  return (
    <div className="page-section">
      <div className="page-header">
        <h1>Record Lunch Bill</h1>
        <p>Add payer and custom amount per person for different items/prices.</p>
      </div>

      {!activeMembers.length ? (
        <section className="card">
          <p className="empty-state">No active members. Add members in Profile first.</p>
        </section>
      ) : (
        <form className="card form-grid" onSubmit={handleSubmit}>
          {message ? <p className="form-message">{message}</p> : null}

          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label>
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Office lunch"
            />
          </label>

          <label>
            Total amount (optional)
            <input
              type="number"
              min="0"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="Leave empty to use sum of individual amounts"
            />
          </label>

          <label>
            Paid by
            <select value={paidById} onChange={(e) => setPaidById(e.target.value)}>
              <option value="">Select member</option>
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <div className="checkbox-group">
            <span>Participants</span>
            <div className="chips-wrap">
              {activeMembers.map((member) => (
                <label key={member.id} className="chip-check">
                  <input
                    type="checkbox"
                    checked={participantIds.includes(member.id)}
                    onChange={() => toggleParticipant(member.id)}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="full-width share-panel">
            <div className="section-title-row">
              <h2>Individual amounts</h2>
              <span className="muted">Enter each person&apos;s actual spend</span>
            </div>
            {selectedMembers.length === 0 ? (
              <p className="empty-state">Select participants to assign amounts.</p>
            ) : (
              <div className="share-grid">
                {selectedMembers.map((member) => (
                  <label key={member.id} className="share-row">
                    <span>{member.name}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={participantShares[member.id] ?? ""}
                      onChange={(e) => handleShareChange(member.id, e.target.value)}
                      placeholder="0.00"
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="share-summary">
              <span>Individual sum: {formatCurrency(sharesTotal)}</span>
              <span>Total bill: {formatCurrency(effectiveTotal)}</span>
              {!totalMatches ? (
                <span className="amount-negative">
                  Total and individual sums must match
                </span>
              ) : null}
            </div>
          </div>

          <label className="full-width">
            Note (optional)
            <textarea
              rows="3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Special items, absentees, snacks, etc."
            />
          </label>

          <button type="submit" className="primary-btn">
            Save Lunch Bill
          </button>
        </form>
      )}

      <section className="card">
        <div className="section-title-row">
          <h2>Recent Entries</h2>
        </div>
        {records.length === 0 ? (
          <p className="empty-state">No bills recorded yet.</p>
        ) : (
          <div className="record-list">
            {records.slice(0, 5).map((record) => (
              <div key={record.id} className="record-item">
                <div>
                  <strong>{record.description}</strong>
                  <p className="muted">{record.date} | Paid by {record.paidByName}</p>
                </div>
                <strong>{formatCurrency(record.total)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Record;
