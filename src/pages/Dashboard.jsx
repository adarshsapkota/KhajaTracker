import React from "react";
import { useLunchApp } from "../context/LunchContext";
import {
  formatCurrency,
  formatDate,
  getBalances,
  getDashboardStats,
  getParticipantShareEntries,
} from "../helper/lunchUtils";

function Dashboard() {
  const { records } = useLunchApp();
  const stats = getDashboardStats(records);
  const balances = getBalances(records);
  const recentRecords = records.slice(0, 5);

  return (
    <div className="page-section">
      <div className="page-header">
        <h1>Lunch Split Dashboard</h1>
        <p>Track office lunch expenses and see who should settle up.</p>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <span className="muted">Today total</span>
          <h3>{formatCurrency(stats.todayTotal)}</h3>
          <small>{stats.todayCount} entries today</small>
        </div>
        <div className="card stat-card">
          <span className="muted">This month</span>
          <h3>{formatCurrency(stats.monthTotal)}</h3>
          <small>Current month spend</small>
        </div>
        <div className="card stat-card">
          <span className="muted">All-time spend</span>
          <h3>{formatCurrency(stats.grandTotal)}</h3>
          <small>{records.length} total lunch records</small>
        </div>
      </div>

      <div className="two-col-grid">
        <section className="card">
          <div className="section-title-row">
            <h2>Balances</h2>
            <span className="muted">Positive means they should receive</span>
          </div>
          {balances.length === 0 ? (
            <p className="empty-state">No records yet. Go to Record and add today&apos;s lunch bill.</p>
          ) : (
            <div className="balance-list">
              {balances.map((person) => (
                <div key={person.id} className="balance-item">
                  <span>{person.name}</span>
                  <strong className={person.amount >= 0 ? "amount-positive" : "amount-negative"}>
                    {formatCurrency(person.amount)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-title-row">
            <h2>Recent lunches</h2>
          </div>
          {recentRecords.length === 0 ? (
            <p className="empty-state">No lunches recorded yet.</p>
          ) : (
            <div className="record-list">
              {recentRecords.map((record) => (
                <div key={record.id} className="record-item">
                  <div>
                    <strong>{record.description}</strong>
                    <p className="muted">{formatDate(record.date)} | Paid by {record.paidByName}</p>
                    <p className="muted">
                      {getParticipantShareEntries(record)
                        .map((entry) => `${entry.name}: ${formatCurrency(entry.amount)}`)
                        .join(" | ")}
                    </p>
                  </div>
                  <strong>{formatCurrency(record.total)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
