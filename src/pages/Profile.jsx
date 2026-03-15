import React, { useState } from "react";
import { useLunchApp } from "../context/LunchContext";

function Profile() {
  const {
    groups,
    selectedGroupId,
    selectGroup,
    createGroup,
    invites,
    respondToInvite,
    members,
    addMember,
    clearAllData,
    records,
    payments,
  } = useLunchApp();
  const [groupName, setGroupName] = useState("");
  const [memberUsername, setMemberUsername] = useState("");
  const [message, setMessage] = useState("");

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    const result = await createGroup(groupName);
    setMessage(result.message || "");
    if (result.ok) setGroupName("");
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    const result = await addMember(memberUsername);
    setMessage(result.message || "");
    if (result.ok) {
      setMemberUsername("");
    }
  };

  const handleInviteAction = async (inviteId, action) => {
    const result = await respondToInvite(inviteId, action);
    setMessage(result.message || "");
  };

  return (
    <div className="page-section">
      <div className="page-header">
        <h1>Groups & Members</h1>
        <p>Create groups, invite registered users, and manage group participants.</p>
      </div>

      <div className="two-col-grid">
        <section className="card">
          <h2>Create Group</h2>
          <form onSubmit={handleCreateGroup} className="stack-form">
            {message ? <p className="form-message">{message}</p> : null}
            <label>
              Group name
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </label>
            <button type="submit" className="primary-btn">
              Create Group
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Data Summary</h2>
          <p className="muted">Groups: {groups.length}</p>
          <p className="muted">Members in selected group: {members.length}</p>
          <p className="muted">Lunch records: {records.length}</p>
          <p className="muted">Payment entries: {payments.length}</p>
          <button type="button" className="danger-btn" onClick={clearAllData}>
            Clear Selected Group Expenses
          </button>
        </section>
      </div>

      <section className="card">
        <div className="section-title-row">
          <h2>Select Group</h2>
        </div>
        {groups.length === 0 ? (
          <p className="empty-state">No groups yet. Create your first group.</p>
        ) : (
          <label>
            Group
            <select
              value={selectedGroupId || ""}
              onChange={(event) => selectGroup(event.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.role})
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Invite Member</h2>
        </div>
        <form onSubmit={handleInvite} className="stack-form">
          <label>
            Registered username
            <input
              type="text"
              value={memberUsername}
              onChange={(e) => setMemberUsername(e.target.value)}
              placeholder="Enter username"
              disabled={!selectedGroupId}
            />
          </label>
          <button type="submit" className="primary-btn" disabled={!selectedGroupId}>
            Send Invite
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Incoming Invites</h2>
        </div>
        {invites.length === 0 ? (
          <p className="empty-state">No pending invites.</p>
        ) : (
          <div className="member-list">
            {invites.map((invite) => (
              <div key={invite.id} className="member-item">
                <div>
                  <strong>{invite.groupName}</strong>
                  <p className="muted">Invited by {invite.invitedByName}</p>
                </div>
                <div className="member-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => handleInviteAction(invite.id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => handleInviteAction(invite.id, "decline")}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title-row">
          <h2>Group Members</h2>
        </div>
        {members.length === 0 ? (
          <p className="empty-state">No members in selected group.</p>
        ) : (
          <div className="member-list">
            {members.map((member) => (
              <div key={member.id} className="member-item">
                <div>
                  <strong>{member.name}</strong>
                  {member.username ? <p className="muted">@{member.username}</p> : null}
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
