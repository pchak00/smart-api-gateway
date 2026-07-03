import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { AdminRole, AdminUserDto } from '../types';
import { canManageAdminUser, getAssignableRoles, getRoleLabel, isOwnerRole, isSuperAdminRole } from '../utils/roles';
import { RowActions } from '../components/RowActions';
import { getApiErrorMessage } from '../utils/apiError';
import { PasswordInput } from '../components/PasswordInput';

export const AdminUsersPage: React.FC = () => {
  const { role, username } = useAuth();
  const { showToast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserDto | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('READ_ONLY_ADMIN');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('READ_ONLY_ADMIN');
  const assignableRoles = useMemo(() => getAssignableRoles(role), [role]);
  const canCreateAdminUsers = assignableRoles.length > 0;
  const writeTooltip = !canCreateAdminUsers ? 'Owner or Admin required' : undefined;

  const loadAdminUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setAdminUsers(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load admin users:', error);
      setAdminUsers([]);
      setErrorMessage('Backend admin users are unavailable right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  useEffect(() => {
    if (!assignableRoles.includes(newRole)) {
      setNewRole(assignableRoles[assignableRoles.length - 1] ?? 'READ_ONLY_ADMIN');
    }
  }, [assignableRoles, newRole]);

  const getEditableRoles = (targetRole: AdminRole | string): AdminRole[] => {
    if (isOwnerRole(role)) return ['OWNER', 'SUPER_ADMIN', 'READ_ONLY_ADMIN'];
    if (isSuperAdminRole(role) && targetRole === 'READ_ONLY_ADMIN') return ['READ_ONLY_ADMIN'];
    return [];
  };

  const resetCreateForm = () => {
    setNewUsername('');
    setNewPassword('');
    setNewRole(assignableRoles[assignableRoles.length - 1] ?? 'READ_ONLY_ADMIN');
  };

  const handleCreateAdmin = async (event: FormEvent) => {
    event.preventDefault();
    if (!canCreateAdminUsers) return;

    setIsSubmitting(true);
    try {
      await api.createAdminUser({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole
      });
      showToast({ message: 'Admin user created.', type: 'success' });
      resetCreateForm();
      setIsCreateOpen(false);
      await loadAdminUsers();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not create admin user.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRoleEdit = (adminUser: AdminUserDto) => {
    const editableRoles = getEditableRoles(adminUser.role);
    if (editableRoles.length === 0) return;

    setEditingAdmin(adminUser);
    setIsCreateOpen(false);
    setSelectedRole(editableRoles.includes(adminUser.role as AdminRole)
      ? adminUser.role as AdminRole
      : editableRoles[editableRoles.length - 1]);
  };

  const handleUpdateRole = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingAdmin?.id || !canManageAdminUser(role, editingAdmin.role)) return;

    setIsSubmitting(true);
    try {
      await api.updateAdminUserRole(editingAdmin.id, { role: selectedRole });
      showToast({ message: 'Admin role updated.', type: 'success' });
      setEditingAdmin(null);
      await loadAdminUsers();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not update admin role.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminUser: AdminUserDto) => {
    if (!adminUser.id || !canManageAdminUser(role, adminUser.role)) return;
    if (!window.confirm(`Delete admin user ${adminUser.username}?`)) return;

    setIsSubmitting(true);
    try {
      await api.deleteAdminUser(adminUser.id);
      showToast({ message: 'Admin user deleted.', type: 'success' });
      await loadAdminUsers();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not delete admin user.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin Users"
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
        actions={
          <PrimaryButton
            type="button"
            disabled={!canCreateAdminUsers}
            tooltip={writeTooltip}
            onClick={() => {
              setEditingAdmin(null);
              resetCreateForm();
              setIsCreateOpen((open) => !open);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            Create Admin
          </PrimaryButton>
        }
      />

      {isCreateOpen && (
        <form onSubmit={handleCreateAdmin} className="mb-8 grid gap-4 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_auto] md:items-end">
          <label className="block text-sm text-slate-500">
            Username
            <input
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              required
            />
          </label>
          <label className="block text-sm text-slate-500">
            Password
            <PasswordInput
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              wrapperClassName="mt-2"
              inputClassName="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              required
            />
          </label>
          <label className="block text-sm text-slate-500">
            Role
            <select
              value={newRole}
              onChange={(event) => setNewRole(event.target.value as AdminRole)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              {assignableRoles.map((assignableRole) => (
                <option key={assignableRole} value={assignableRole}>
                  {getRoleLabel(assignableRole)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={isSubmitting}>
              Create
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      )}

      {editingAdmin && (
        <form onSubmit={handleUpdateRole} className="mb-8 flex flex-wrap items-end gap-4 py-2">
          <div className="min-w-56 flex-1">
            <p className="text-sm font-medium text-slate-100">{editingAdmin.username}</p>
            <p className="mt-1 text-xs text-slate-500">Update access level</p>
          </div>
          <label className="block min-w-48 text-sm text-slate-500">
            Role
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as AdminRole)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              {getEditableRoles(editingAdmin.role).map((editableRole) => (
                <option key={editableRole} value={editableRole}>
                  {getRoleLabel(editableRole)}
                </option>
              ))}
            </select>
          </label>
          <PrimaryButton type="submit" disabled={isSubmitting}>
            Save
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => setEditingAdmin(null)}>
            Cancel
          </SecondaryButton>
        </form>
      )}

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading admin users...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={UserCog}
            title="Admin users unavailable"
            description={errorMessage}
          />
        ) : adminUsers.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No admin users to show"
            description="Admin user records will appear here once the gateway returns them."
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[560px]">
              <thead className="border-b border-slate-800/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/35">
                {adminUsers.map((adminUser) => {
                  const canManageRow = canManageAdminUser(role, adminUser.role);
                  const editableRoles = getEditableRoles(adminUser.role);
                  const canChangeRole = editableRoles.length > 1;
                  const isCurrentUser = adminUser.username === username;
                  const rowAccessTitle = canManageRow ? undefined : 'Owner required';

                  return (
                    <tr key={adminUser.id ?? adminUser.username} className="transition-colors hover:bg-slate-900/35">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <UserCog className="text-slate-600" size={16} aria-hidden="true" />
                          <span className="text-sm font-medium text-slate-100">{adminUser.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">{getRoleLabel(adminUser.role)}</td>
                      <td className="px-4 py-4 text-right text-sm">
                        {adminUser.id !== undefined && (
                          <RowActions
                            actions={[
                              {
                                label: 'Change role',
                                disabled: !canChangeRole,
                                title: rowAccessTitle ?? (!canChangeRole ? 'No role changes available' : undefined),
                                onClick: () => startRoleEdit(adminUser)
                              },
                              {
                                label: 'Delete',
                                tone: 'danger',
                                disabled: !canManageRow || isCurrentUser,
                                title: rowAccessTitle ?? (isCurrentUser
                                  ? 'You cannot delete your current session user'
                                  : undefined),
                                onClick: () => handleDeleteAdmin(adminUser)
                              }
                            ]}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
