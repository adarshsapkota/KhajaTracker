export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function getTodayDateString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getPerHead(record) {
  const count = record?.participantIds?.length || 0;
  if (!count) return 0;
  return (Number(record.total) || 0) / count;
}

export function getParticipantShareEntries(record) {
  const participantIds = Array.isArray(record?.participantIds) ? record.participantIds : [];
  const participantNames = Array.isArray(record?.participantNames)
    ? record.participantNames
    : [];
  const total = Number(record?.total) || 0;
  const count = participantIds.length;
  const storedShares =
    record && typeof record.participantShares === "object" && record.participantShares
      ? record.participantShares
      : {};

  if (!count) return [];

  return participantIds.map((id, index) => {
    const name = participantNames[index] || "Unknown";
    const rawShare = Number(storedShares[id]);
    const amount = Number.isFinite(rawShare) ? rawShare : total / count;
    return {
      id,
      name,
      amount: Number(amount.toFixed(2)),
    };
  });
}

export function getSplitSummary(record) {
  const entries = getParticipantShareEntries(record);
  if (!entries.length) return "-";
  return entries
    .map((entry) => `${entry.name}: ${formatCurrency(entry.amount)}`)
    .join(", ");
}

export function getBalances(records) {
  const balances = {};

  records.forEach((record) => {
    const total = Number(record.total) || 0;
    const shareEntries = getParticipantShareEntries(record);

    shareEntries.forEach((entry) => {
      const key = entry.id || `name_${entry.name}`;
      const name = entry.name || "Unknown";
      if (!balances[key]) balances[key] = { id: key, name, amount: 0 };
      balances[key].amount -= entry.amount;
    });

    const payerKey = record.paidById || `name_${record.paidByName}`;
    const payerName = record.paidByName || "Unknown";
    if (!balances[payerKey]) {
      balances[payerKey] = { id: payerKey, name: payerName, amount: 0 };
    }
    balances[payerKey].amount += total;
  });

  return Object.values(balances)
    .map((entry) => ({ ...entry, amount: Number(entry.amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount);
}

export function getDashboardStats(records) {
  const today = getTodayDateString();
  const current = new Date();
  let todayTotal = 0;
  let todayCount = 0;
  let monthTotal = 0;

  records.forEach((record) => {
    const total = Number(record.total) || 0;

    if (record.date === today) {
      todayTotal += total;
      todayCount += 1;
    }

    const date = new Date(record.date);
    if (
      date.getFullYear() === current.getFullYear() &&
      date.getMonth() === current.getMonth()
    ) {
      monthTotal += total;
    }
  });

  const grandTotal = records.reduce(
    (sum, record) => sum + (Number(record.total) || 0),
    0
  );

  return {
    todayTotal: Number(todayTotal.toFixed(2)),
    todayCount,
    monthTotal: Number(monthTotal.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}

export function getShareTotal(participantShares, participantIds) {
  if (!participantShares || !Array.isArray(participantIds)) return 0;
  return Number(
    participantIds
      .reduce((sum, id) => sum + (Number(participantShares[id]) || 0), 0)
      .toFixed(2)
  );
}

export function getReceivablesByMember(records, payments = []) {
  const receivables = {};
  const receivedByMember = {};

  records.forEach((record) => {
    const payerId = record?.paidById;
    const shareEntries = getParticipantShareEntries(record);

    shareEntries.forEach((entry) => {
      if (payerId && entry.id === payerId) {
        return;
      }

      const key = entry.id || `name_${entry.name}`;
      if (!receivables[key]) {
        receivables[key] = {
          id: key,
          name: entry.name || "Unknown",
          amount: 0,
        };
      }
      receivables[key].amount += Number(entry.amount) || 0;
    });
  });

  payments.forEach((payment) => {
    if (!payment?.memberId) return;
    const amount = Number(payment.amount) || 0;
    if (amount <= 0) return;
    receivedByMember[payment.memberId] =
      (receivedByMember[payment.memberId] || 0) + amount;
  });

  const members = Object.values(receivables)
    .map((item) => {
      const received = Number(receivedByMember[item.id] || 0);
      const pending = Math.max(0, item.amount - received);
      return {
        ...item,
        grossAmount: Number(item.amount.toFixed(2)),
        receivedAmount: Number(received.toFixed(2)),
        amount: Number(pending.toFixed(2)),
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = Number(
    members.reduce((sum, item) => sum + item.amount, 0).toFixed(2)
  );

  return { members, total };
}
