import React, { useState } from "react";
import { useLunchApp } from "../context/LunchContext";

function Profile() {
  const {
    members,
    addMember,
    toggleMemberActive,
    deleteMember,
    clearAllData,
    records,
  } = useLunchApp();
  const [memberName, setMemberName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = addMember(memberName);
    setMessage(result.message || (result.ok ? "Member added" : ""));
    if (result.ok) {
      setMemberName("");
    }
  };

  const handleDelete = (memberId) => {
    const result = deleteMember(memberId);
    setMessage(result.message || (result.ok ? "Member deleted" : ""));
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <h1>Team Profile</h1>
        <p>Manage colleagues who participate in daily office lunch.</p>
      </div>

      <div className="two-col-grid">
        <section className="card">
          <h2>Add Member</h2>
          <form onSubmit={handleSubmit} className="stack-form">
            {message ? <p className="form-message">{message}</p> : null}
            <label>
              Member name
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter name"
              />
            </label>
            <button type="submit" className="primary-btn">
              Add Member
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Data Summary</h2>
          <p className="muted">Members: {members.length}</p>
          <p className="muted">Lunch records: {records.length}</p>
          <button type="button" className="danger-btn" onClick={clearAllData}>
            Clear Local Data
          </button>
        </section>
      </div>

      <section className="card">
        <div className="section-title-row">
          <h2>Members</h2>
        </div>
        {members.length === 0 ? (
          <p className="empty-state">No members added yet.</p>
        ) : (
          <div className="member-list">
            {members.map((member) => (
              <div key={member.id} className="member-item">
                <div>
                  <strong>{member.name}</strong>
                  <p className="muted">{member.active ? "Active" : "Inactive"}</p>
                </div>
                <div className="member-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => toggleMemberActive(member.id)}
                  >
                    {member.active ? "Mark Inactive" : "Mark Active"}
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => handleDelete(member.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Profile;
