import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import supabase from "../helper/supabaseClient";
import { getReceivablesByMember, roundMoney } from "../helper/lunchUtils";

const SELECTED_GROUP_KEY = "khajaexpense_selected_group_v1";
const GROUPS_TABLE = "lunch_groups";
const GROUP_MEMBERS_TABLE = "group_members";
const GROUP_INVITES_TABLE = "group_invites";
const GROUP_STATE_TABLE = "group_app_state";

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
      username: member.username ? String(member.username) : "",
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
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(() =>
    safeParse(SELECTED_GROUP_KEY, "")
  );
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invites, setInvites] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const hasLoadedGroupStateRef = useRef(false);
  const saveTimerRef = useRef(null);

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
      hasLoadedGroupStateRef.current = false;
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadGroupsAndInvites() {
      if (!isAuthReady) return;

      if (!authUser?.id) {
        hasLoadedGroupStateRef.current = false;
        setIsRemoteLoading(false);
        setSyncError("");
        setGroups([]);
        setMembers([]);
        setRecords([]);
        setPayments([]);
        setInvites([]);
        setSelectedGroupId("");
        return;
      }

      setIsRemoteLoading(true);
      setSyncError("");

      const { data: memberships, error: membershipError } = await supabase
        .from(GROUP_MEMBERS_TABLE)
        .select("group_id, role")
        .eq("user_id", authUser.id);
      if (cancelled) return;

      if (membershipError) {
        setSyncError(membershipError.message);
        setIsRemoteLoading(false);
        return;
      }

      const groupIds = (memberships || []).map((item) => item.group_id);
      let groupMap = new Map();
      if (groupIds.length) {
        const { data: groupRows, error: groupsError } = await supabase
          .from(GROUPS_TABLE)
          .select("id, name, created_by, created_at")
          .in("id", groupIds);
        if (cancelled) return;
        if (groupsError) {
          setSyncError(groupsError.message);
          setIsRemoteLoading(false);
          return;
        }
        groupMap = new Map((groupRows || []).map((group) => [group.id, group]));
      }

      const groupList = (memberships || [])
        .map((membership) => {
          const group = groupMap.get(membership.group_id);
          if (!group) return null;
          return {
            id: group.id,
            name: group.name,
            createdBy: group.created_by,
            createdAt: group.created_at,
            role: membership.role || "member",
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      setGroups(groupList);

      let nextSelectedGroupId = selectedGroupId;
      const hasSelected = groupList.some((group) => group.id === nextSelectedGroupId);
      if (!hasSelected) {
        nextSelectedGroupId = groupList[0]?.id || "";
        setSelectedGroupId(nextSelectedGroupId);
      }

      const { data: inviteRows, error: invitesError } = await supabase
        .from(GROUP_INVITES_TABLE)
        .select("id, group_id, invited_by, status, created_at")
        .eq("invited_user_id", authUser.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (invitesError) {
        setSyncError(invitesError.message);
        setIsRemoteLoading(false);
        return;
      }

      const inviteGroupIds = Array.from(new Set((inviteRows || []).map((row) => row.group_id)));
      const inviteByIds = Array.from(new Set((inviteRows || []).map((row) => row.invited_by)));

      let inviteGroupsMap = new Map();
      if (inviteGroupIds.length) {
        const { data: inviteGroups } = await supabase
          .from(GROUPS_TABLE)
          .select("id, name")
          .in("id", inviteGroupIds);
        inviteGroupsMap = new Map((inviteGroups || []).map((group) => [group.id, group]));
      }

      let inviteByMap = new Map();
      if (inviteByIds.length) {
        const { data: inviteByProfiles } = await supabase
          .from("user_profiles")
          .select("id, username, display_name")
          .in("id", inviteByIds);
        inviteByMap = new Map((inviteByProfiles || []).map((profile) => [profile.id, profile]));
      }

      setInvites(
        (inviteRows || []).map((invite) => {
          const inviter = inviteByMap.get(invite.invited_by);
          const group = inviteGroupsMap.get(invite.group_id);
          return {
            id: invite.id,
            groupId: invite.group_id,
            groupName: group?.name || "Unknown group",
            invitedById: invite.invited_by,
            invitedByName:
              inviter?.display_name || inviter?.username || "Unknown",
            createdAt: invite.created_at,
          };
        })
      );

      if (!cancelled) setIsRemoteLoading(false);
    }

    loadGroupsAndInvites();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, isAuthReady, selectedGroupId]);

  useEffect(() => {
    localStorage.setItem(SELECTED_GROUP_KEY, JSON.stringify(selectedGroupId || ""));
  }, [selectedGroupId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedGroupState() {
      if (!authUser?.id || !selectedGroupId) {
        setMembers([]);
        setRecords([]);
        setPayments([]);
        hasLoadedGroupStateRef.current = false;
        return;
      }

      const { data: memberRows, error: memberError } = await supabase
        .from(GROUP_MEMBERS_TABLE)
        .select("user_id, role")
        .eq("group_id", selectedGroupId);

      if (cancelled) return;
      if (memberError) {
        setSyncError(memberError.message);
        return;
      }

      const memberIds = (memberRows || []).map((row) => row.user_id);
      let profilesMap = new Map();
      if (memberIds.length) {
        const { data: profiles, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, username, display_name")
          .in("id", memberIds);
        if (cancelled) return;
        if (profileError) {
          setSyncError(profileError.message);
          return;
        }
        profilesMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
      }

      const normalizedMembers = normalizeMembers(
        (memberRows || []).map((row) => {
          const profile = profilesMap.get(row.user_id);
          return {
            id: row.user_id,
            username: profile?.username || "",
            name: profile?.display_name || profile?.username || "Unknown",
            active: true,
            createdAt: new Date().toISOString(),
            role: row.role,
          };
        })
      );

      const { data: stateRow, error: stateError } = await supabase
        .from(GROUP_STATE_TABLE)
        .select("records, payments")
        .eq("group_id", selectedGroupId)
        .maybeSingle();

      if (cancelled) return;
      if (stateError) {
        setSyncError(stateError.message);
        return;
      }

      if (!stateRow) {
        await supabase.from(GROUP_STATE_TABLE).upsert(
          {
            group_id: selectedGroupId,
            records: [],
            payments: [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "group_id" }
        );
      }

      setMembers(normalizedMembers);
      setRecords(normalizeRecords(stateRow?.records || []));
      setPayments(normalizePayments(stateRow?.payments || []));
      hasLoadedGroupStateRef.current = true;
      setSyncError("");
    }

    loadSelectedGroupState();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, selectedGroupId]);

  useEffect(() => {
    if (!authUser?.id || !selectedGroupId || !hasLoadedGroupStateRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const { error } = await supabase.from(GROUP_STATE_TABLE).upsert(
        {
          group_id: selectedGroupId,
          records,
          payments,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "group_id" }
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
  }, [authUser?.id, selectedGroupId, records, payments]);

  const activeMembers = members.filter((member) => member.active);

  const createGroup = async (groupName) => {
    const trimmed = (groupName || "").trim();
    if (!trimmed) return { ok: false, message: "Enter a group name" };
    if (!authUser?.id) return { ok: false, message: "Please login first" };

    const { data: groupData, error: groupError } = await supabase
      .from(GROUPS_TABLE)
      .insert({
        name: trimmed,
        created_by: authUser.id,
      })
      .select("id, name, created_by, created_at")
      .single();

    if (groupError) return { ok: false, message: groupError.message };

    const { error: memberError } = await supabase.from(GROUP_MEMBERS_TABLE).insert({
      group_id: groupData.id,
      user_id: authUser.id,
      role: "owner",
    });
    if (memberError) return { ok: false, message: memberError.message };

    await supabase.from(GROUP_STATE_TABLE).upsert(
      {
        group_id: groupData.id,
        records: [],
        payments: [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_id" }
    );

    setGroups((prev) =>
      [...prev, { id: groupData.id, name: groupData.name, role: "owner" }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setSelectedGroupId(groupData.id);
    return { ok: true, message: "Group created" };
  };

  const selectGroup = (groupId) => {
    setSelectedGroupId(groupId || "");
  };

  const addMember = async (username) => {
    const trimmed = username.trim();
    if (!trimmed) {
      return { ok: false, message: "Enter a username" };
    }
    if (!selectedGroupId) {
      return { ok: false, message: "Create or select a group first" };
    }

    const normalizedUsername = trimmed.toLowerCase();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, username, display_name")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (error) {
      return { ok: false, message: error.message };
    }

    if (!data?.id) {
      return { ok: false, message: "User not found. Ask them to register first." };
    }

    const { data: existingMember } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select("group_id")
      .eq("group_id", selectedGroupId)
      .eq("user_id", data.id)
      .maybeSingle();

    if (existingMember) {
      return { ok: false, message: "User already in this group" };
    }

    const { data: existingInvite } = await supabase
      .from(GROUP_INVITES_TABLE)
      .select("id")
      .eq("group_id", selectedGroupId)
      .eq("invited_user_id", data.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return { ok: false, message: "Invite already sent" };
    }

    const { error: inviteError } = await supabase.from(GROUP_INVITES_TABLE).insert({
      group_id: selectedGroupId,
      invited_user_id: data.id,
      invited_by: authUser?.id,
      status: "pending",
    });

    if (inviteError) {
      return { ok: false, message: inviteError.message };
    }

    return { ok: true, message: `Invite sent to @${normalizedUsername}` };
  };

  const toggleMemberActive = (memberId) => {
    return { ok: false, message: "Not available in group mode" };
  };

  const deleteMember = (memberId) => {
    return { ok: false, message: "Not available in group mode" };
  };

  const respondToInvite = async (inviteId, action) => {
    const invite = invites.find((item) => item.id === inviteId);
    if (!invite) return { ok: false, message: "Invite not found" };

    if (action === "accept") {
      const { error: memberError } = await supabase.from(GROUP_MEMBERS_TABLE).insert({
        group_id: invite.groupId,
        user_id: authUser?.id,
        role: "member",
      });
      if (memberError && !memberError.message.includes("duplicate")) {
        return { ok: false, message: memberError.message };
      }
    }

    const nextStatus = action === "accept" ? "accepted" : "declined";
    const { error: updateError } = await supabase
      .from(GROUP_INVITES_TABLE)
      .update({
        status: nextStatus,
        responded_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (updateError) return { ok: false, message: updateError.message };

    setInvites((prev) => prev.filter((item) => item.id !== inviteId));
    return { ok: true, message: action === "accept" ? "Joined group" : "Invite declined" };
  };

  const addRecord = (input) => {
    if (!selectedGroupId) return { ok: false, message: "Create/select a group first" };
    const participantIds = Array.isArray(input.participantIds)
      ? input.participantIds.filter(Boolean)
      : [];
    const splitMode = input?.splitMode === "individual" ? "individual" : "equal";
    const participantSharesInput =
      input && typeof input.participantShares === "object" && input.participantShares
        ? input.participantShares
        : {};

    if (!input.date) return { ok: false, message: "Select a date" };
    if (!input.paidById) return { ok: false, message: "Select who paid" };
    if (participantIds.length === 0) {
      return { ok: false, message: "Select at least one participant" };
    }
    if (!participantIds.includes(input.paidById)) {
      return { ok: false, message: "Payer must be included in participants" };
    }

    let total = 0;
    let participantShares = {};

    if (splitMode === "equal") {
      const totalInput =
        input.total === "" || input.total == null ? null : roundMoney(input.total);
      if (!Number.isFinite(totalInput) || totalInput == null || totalInput <= 0) {
        return { ok: false, message: "Enter a valid total amount" };
      }
      total = totalInput;
      participantShares = {};
    } else {
      const hasMissingShare = participantIds.some((id) => {
        const rawValue = participantSharesInput[id];
        return rawValue === undefined || rawValue === null || String(rawValue).trim() === "";
      });
      if (hasMissingShare) {
        return {
          ok: false,
          message: "Enter amount for each selected participant (use 0 if needed)",
        };
      }

      participantShares = Object.fromEntries(
        participantIds.map((id) => [id, roundMoney(participantSharesInput[id])])
      );

      const invalidShare = participantIds.some((id) => participantShares[id] < 0);
      if (invalidShare) {
        return { ok: false, message: "Amount cannot be negative" };
      }

      const sharesTotal = roundMoney(
        participantIds.reduce((sum, id) => sum + (participantShares[id] || 0), 0)
      );
      if (sharesTotal <= 0) {
        return { ok: false, message: "At least one participant amount must be greater than 0" };
      }
      total = sharesTotal;
    }

    const memberMap = new Map(members.map((member) => [member.id, member.name]));

    const record = {
      id: makeId("lunch"),
      date: input.date,
      splitMode,
      description: (input.description || "Office lunch").trim() || "Office lunch",
      total: roundMoney(total),
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
    setRecords([]);
    setPayments([]);
  };

  const addPayment = (input) => {
    if (!input.date) return { ok: false, message: "Select a date" };
    if (!input.memberId) return { ok: false, message: "Select member" };

    const requestedAmount = Number(input.amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return { ok: false, message: "Enter a valid amount" };
    }
    if (!selectedGroupId) return { ok: false, message: "Create/select a group first" };

    const member = members.find((item) => item.id === input.memberId);
    if (!member) return { ok: false, message: "Selected member not found" };

    const receivables = getReceivablesByMember(records, payments);
    const pendingForMember =
      receivables.members.find((item) => item.id === input.memberId)?.amount || 0;

    if (pendingForMember <= 0) {
      return { ok: false, message: "This member has no pending due" };
    }

    const amount = Math.min(requestedAmount, pendingForMember);

    const payment = {
      id: makeId("payment"),
      date: input.date,
      memberId: member.id,
      memberName: member.name,
      amount: roundMoney(amount),
      note: (input.note || "").trim(),
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) =>
      [payment, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date))
    );

    if (requestedAmount > pendingForMember) {
      return {
        ok: true,
        payment,
        message: `Payment capped to pending due (${pendingForMember.toFixed(2)})`,
      };
    }

    return { ok: true, payment, message: "Payment recorded" };
  };

  const deletePayment = (paymentId) => {
    const exists = payments.some((payment) => payment.id === paymentId);
    if (!exists) {
      return { ok: false, message: "Payment not found" };
    }

    setPayments((prev) => prev.filter((payment) => payment.id !== paymentId));
    return { ok: true, message: "Payment removed" };
  };

  const settleGroupPayments = (input) => {
    if (!selectedGroupId) return { ok: false, message: "Create/select a group first" };
    if (!input?.date) return { ok: false, message: "Select a date" };

    const receivables = getReceivablesByMember(records, payments);
    if (!receivables.members.length) {
      return { ok: false, message: "No pending dues to settle for this group" };
    }

    const createdAt = new Date().toISOString();
    const note = (input.note || "").trim();
    const groupPayments = receivables.members.map((member) => ({
      id: makeId("payment"),
      date: input.date,
      memberId: member.id,
      memberName: member.name,
      amount: roundMoney(member.amount),
      note: note || "Group settlement",
      createdAt,
    }));

    setPayments((prev) =>
      [...groupPayments, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date))
    );

    return {
      ok: true,
      message: `Settled ${groupPayments.length} members for ${receivables.total.toFixed(2)}`,
    };
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
        groups,
        selectedGroupId,
        members,
        activeMembers,
        records,
        payments,
        invites,
        authUser,
        isAuthReady,
        isRemoteLoading,
        syncError,
        createGroup,
        selectGroup,
        respondToInvite,
        addMember,
        toggleMemberActive,
        deleteMember,
        addRecord,
        addPayment,
        settleGroupPayments,
        deletePayment,
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
