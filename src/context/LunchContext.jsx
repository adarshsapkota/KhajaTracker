import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import supabase from "../helper/supabaseClient";

const MEMBERS_KEY = "khajaexpense_members_v1";
const RECORDS_KEY = "khajaexpense_records_v1";
const PAYMENTS_KEY = "khajaexpense_payments_v1";
const SUPABASE_STATE_TABLE = "lunch_app_state";

const LunchContext = createContext(null);

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function makeId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMembers(members) {
  if (!Array.isArray(members)) return [];
  return members
    .filter((member) => member && member.id && member.name)
    .map((member) => ({
      id: String(member.id),
      name: String(member.name),
      active: member.active !== false,
      createdAt: member.createdAt || new Date().toISOString(),
    }));
}

function normalizeRecords(records) {
  if (!Array.isArray(records)) return [];
  return records
    .filter((record) => record && record.id)
    .map((record) => ({
      ...record,
      total: Number(record.total) || 0,
      participantIds: Array.isArray(record.participantIds) ? record.participantIds : [],
      participantNames: Array.isArray(record.participantNames) ? record.participantNames : [],
      participantShares:
        record && typeof record.participantShares === "object" && record.participantShares
          ? Object.fromEntries(
              Object.entries(record.participantShares).map(([id, amount]) => [
                String(id),
                Number(amount) || 0,
              ])
            )
          : {},
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function normalizePayments(payments) {
  if (!Array.isArray(payments)) return [];
  return payments
    .filter((payment) => payment && payment.id)
    .map((payment) => ({
      ...payment,
      date: payment.date || new Date().toISOString().slice(0, 10),
      amount: Number(payment.amount) || 0,
      memberId: payment.memberId ? String(payment.memberId) : "",
      memberName: payment.memberName ? String(payment.memberName) : "Unknown",
      note: payment.note ? String(payment.note) : "",
      createdAt: payment.createdAt || new Date().toISOString(),
    }))
    .filter((payment) => payment.memberId && payment.amount > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function LunchProvider({ children }) {
  const [members, setMembers] = useState(() =>
    normalizeMembers(safeParse(MEMBERS_KEY, []))
  );
  const [records, setRecords] = useState(() =>
    normalizeRecords(safeParse(RECORDS_KEY, []))
  );
  const [payments, setPayments] = useState(() =>
    normalizePayments(safeParse(PAYMENTS_KEY, []))
  );
  const [authUser, setAuthUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const hasLoadedRemoteRef = useRef(false);
  const saveTimerRef = useRef(null);
  const membersRef = useRef(members);
  const recordsRef = useRef(records);
  const paymentsRef = useRef(payments);

  useEffect(() => {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
    paymentsRef.current = payments;
  }, [payments]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!error) {
        setAuthUser(data.session?.user ?? null);
      }
      setIsAuthReady(true);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setIsAuthReady(true);
      hasLoadedRemoteRef.current = false;
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRemoteState() {
      if (!isAuthReady) return;

      if (!authUser?.id) {
        hasLoadedRemoteRef.current = false;
        setIsRemoteLoading(false);
        setSyncError("");
        return;
      }

      setIsRemoteLoading(true);
      setSyncError("");

      const { data, error } = await supabase
        .from(SUPABASE_STATE_TABLE)
        .select("members, records, payments")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setSyncError(error.message);
        setIsRemoteLoading(false);
        hasLoadedRemoteRef.current = true;
        return;
      }

      if (data) {
        setMembers(normalizeMembers(data.members || []));
        setRecords(normalizeRecords(data.records || []));
        setPayments(normalizePayments(data.payments || []));
      } else {
        await supabase.from(SUPABASE_STATE_TABLE).upsert(
          {
            user_id: authUser.id,
            members: membersRef.current,
            records: recordsRef.current,
            payments: paymentsRef.current,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }

      if (!cancelled) {
        hasLoadedRemoteRef.current = true;
        setIsRemoteLoading(false);
      }
    }

    loadRemoteState();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, isAuthReady]);

  useEffect(() => {
    if (!authUser?.id || !hasLoadedRemoteRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase.from(SUPABASE_STATE_TABLE).upsert(
        {
          user_id: authUser.id,
          members,
          records,
          payments,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        setSyncError(error.message);
        return;
      }

      setSyncError("");
    }, 250);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [authUser?.id, members, records, payments]);

  const activeMembers = members.filter((member) => member.active);

  const addMember = (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, message: "Enter a member name" };
    }

    const exists = members.some(
      (member) => member.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return { ok: false, message: "Member already exists" };
    }

    setMembers((prev) => [
      ...prev,
      {
        id: makeId("member"),
        name: trimmed,
        active: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    return { ok: true };
  };

  const toggleMemberActive = (memberId) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, active: !member.active } : member
      )
    );
  };

  const deleteMember = (memberId) => {
    const usedInRecords = records.some(
      (record) =>
        record.paidById === memberId || record.participantIds.includes(memberId)
    );
    const usedInPayments = payments.some((payment) => payment.memberId === memberId);

    if (usedInRecords || usedInPayments) {
      return {
        ok: false,
        message: "Member is used in records/payments. Mark inactive instead.",
      };
    }

    setMembers((prev) => prev.filter((member) => member.id !== memberId));
    return { ok: true };
  };

  const addRecord = (input) => {
    const participantIds = Array.isArray(input.participantIds)
      ? input.participantIds.filter(Boolean)
      : [];
    const participantSharesInput =
      input && typeof input.participantShares === "object" && input.participantShares
        ? input.participantShares
        : {};
    const participantShares = Object.fromEntries(
      participantIds.map((id) => [id, Number(participantSharesInput[id]) || 0])
    );
    const sharesTotal = Number(
      participantIds.reduce((sum, id) => sum + (participantShares[id] || 0), 0).toFixed(2)
    );
    const totalInput = input.total === "" || input.total == null ? null : Number(input.total);
    const hasCustomShares = participantIds.some((id) => participantShares[id] > 0);
    const total = totalInput == null ? sharesTotal : totalInput;

    if (!input.date) return { ok: false, message: "Select a date" };
    if (!Number.isFinite(total) || total <= 0) {
      return { ok: false, message: "Enter a valid total amount" };
    }
    if (!input.paidById) return { ok: false, message: "Select who paid" };
    if (participantIds.length === 0) {
      return { ok: false, message: "Select at least one participant" };
    }
    if (hasCustomShares) {
      const invalidShare = participantIds.some((id) => participantShares[id] < 0);
      if (invalidShare) {
        return { ok: false, message: "Amount cannot be negative" };
      }
      if (Math.abs(sharesTotal - total) > 0.01) {
        return {
          ok: false,
          message: "Total amount must match sum of participant amounts",
        };
      }
    }

    const memberMap = new Map(members.map((member) => [member.id, member.name]));

    const record = {
      id: makeId("lunch"),
      date: input.date,
      description: (input.description || "Office lunch").trim() || "Office lunch",
      total: Number(total.toFixed(2)),
      paidById: input.paidById,
      paidByName: memberMap.get(input.paidById) || "Unknown",
      participantIds,
      participantNames: participantIds.map((id) => memberMap.get(id) || "Unknown"),
      participantShares,
      note: (input.note || "").trim(),
      createdAt: new Date().toISOString(),
    };

    setRecords((prev) =>
      [record, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date))
    );

    return { ok: true, record };
  };

  const clearAllData = () => {
    setMembers([]);
    setRecords([]);
    setPayments([]);
  };

  const addPayment = (input) => {
    if (!input.date) return { ok: false, message: "Select a date" };
    if (!input.memberId) return { ok: false, message: "Select member" };

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, message: "Enter a valid amount" };
    }

    const member = members.find((item) => item.id === input.memberId);
    if (!member) return { ok: false, message: "Selected member not found" };

    const payment = {
      id: makeId("payment"),
      date: input.date,
      memberId: member.id,
      memberName: member.name,
      amount: Number(amount.toFixed(2)),
      note: (input.note || "").trim(),
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) =>
      [payment, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date))
    );

    return { ok: true, payment };
  };

  const clearRecords = () => {
    setRecords([]);
    setPayments([]);
  };

  const clearPayments = () => {
    setPayments([]);
  };

  return (
    <LunchContext.Provider
      value={{
        members,
        activeMembers,
        records,
        payments,
        authUser,
        isAuthReady,
        isRemoteLoading,
        syncError,
        addMember,
        toggleMemberActive,
        deleteMember,
        addRecord,
        addPayment,
        clearRecords,
        clearPayments,
        clearAllData,
      }}
    >
      {children}
    </LunchContext.Provider>
  );
}

export function useLunchApp() {
  const context = useContext(LunchContext);
  if (!context) {
    throw new Error("useLunchApp must be used inside LunchProvider");
  }
  return context;
}
