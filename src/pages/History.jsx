import React from "react";
import { useLunchApp } from "../context/LunchContext";
import {
  formatCurrency,
  formatDate,
  getParticipantShareEntries,
} from "../helper/lunchUtils";

function History() {
  const { records } = useLunchApp();

  return (
    <div className="page-section">
      <div className="page-header">
        <h1>Lunch History</h1>
        <p>All recorded office lunch expenses with split calculation.</p>
      </div>

      <section className="card">
        {records.length === 0 ? (
          <p className="empty-state">No lunch records yet.</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Paid By</th>
                  <th>Participants</th>
                  <th>Split Details</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td data-label="Date">{formatDate(record.date)}</td>
                    <td data-label="Description">{record.description}</td>
                    <td data-label="Paid By">{record.paidByName}</td>
                    <td data-label="Participants">{record.participantNames.join(", ")}</td>
                    <td data-label="Split Details">
                      {getParticipantShareEntries(record).map((entry) => (
                        <div key={`${record.id}_${entry.id}`}>
                          {entry.name}: {formatCurrency(entry.amount)}
                        </div>
                      ))}
                    </td>
                    <td data-label="Total">{formatCurrency(record.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default History;
