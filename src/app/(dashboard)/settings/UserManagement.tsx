"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  role: "ORG_ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
};

type UserManagementProps = {
  organizationId: string;
  members: Member[];
};

type PendingMember = {
  email: string;
  firstName: string;
  lastName: string;
  role: "ORG_ADMIN" | "MEMBER";
  tempPassword: string;
};

export default function UserManagement({
  organizationId,
  members,
}: UserManagementProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<PendingMember | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  async function handleAddUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setError(null);
    setCreatedUser(null);

    const formData = new FormData(form);
    const payload = {
      organizationId,
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      role: String(formData.get("role") || "MEMBER"),
    };

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(data.error || "Unable to add user.");
      setIsSubmitting(false);
      return;
    }

    setCreatedUser(data);
    setIsSubmitting(false);
    form.reset();
    router.refresh();
  }

  async function handleRemoveUser(memberId: string) {
    if (!confirm("Remove this user from Levin's Bend?")) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/admin/users/${memberId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to remove user.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  async function handleUpdateUser(
    event: React.FormEvent<HTMLFormElement>,
    memberId: string
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      role: String(formData.get("role") || "MEMBER"),
      password: String(formData.get("password") || ""),
      passwordConfirm: String(formData.get("passwordConfirm") || ""),
    };

    const response = await fetch(`/api/admin/users/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Unable to update user.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setEditingMemberId(null);
    router.refresh();
  }


  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Add user</h2>
        <p className="mt-1 text-xs text-slate-500">
          Create an account for a resident or staff member. A temporary
          password will be generated.
        </p>

        <form onSubmit={handleAddUser} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="firstName"
            >
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="lastName"
            >
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue="MEMBER"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="MEMBER">Member</option>
              <option value="ORG_ADMIN">Org admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? "Adding..." : "Add user"}
            </button>
          </div>
        </form>

        {createdUser ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            <p className="font-medium">User created.</p>
            <p className="mt-1">
              Temporary password:{" "}
              <span className="font-semibold">{createdUser.tempPassword}</span>
            </p>
            <p className="mt-1 text-emerald-600">
              Share this with the user and ask them to update it after logging
              in.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Members</h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage access for current residents.
          </p>
        </div>
        <div className="divide-y divide-slate-200">
          {members.map((member) => {
            const isEditing = editingMemberId === member.id;
            return (
              <div
                key={member.id}
                className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={`${member.user.firstName} ${member.user.lastName}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
                        {member.user.firstName.charAt(0).toUpperCase()}
                        {member.user.lastName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{member.user.email}</p>
                  </div>
                </div>

                {isEditing ? (
                  <form
                    onSubmit={(event) => handleUpdateUser(event, member.id)}
                    className="grid gap-3 md:grid-cols-4"
                  >
                    <input
                      name="firstName"
                      type="text"
                      required
                      defaultValue={member.user.firstName}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    <input
                      name="lastName"
                      type="text"
                      required
                      defaultValue={member.user.lastName}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    <input
                      name="email"
                      type="email"
                      required
                      defaultValue={member.user.email}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ORG_ADMIN">Org admin</option>
                    </select>
                    <input
                      name="password"
                      type="password"
                      placeholder="New password"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:col-span-2"
                    />
                    <input
                      name="passwordConfirm"
                      type="password"
                      placeholder="Confirm password"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:col-span-2"
                    />
                    <div className="flex flex-wrap gap-2 md:col-span-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMemberId(null);
                          setError(null);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                      {member.role === "ORG_ADMIN" ? "Org admin" : "Member"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemberId(member.id);
                        setError(null);
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(member.id)}
                      disabled={isSubmitting}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
