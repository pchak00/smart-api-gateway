import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { IconButton, PrimaryButton, SecondaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { AdminRole, AdminUserDto } from '../types';
import { canManageAdminUser, getAssignableRoles, getRoleLabel, isOwnerRole, isSuperAdminRole } from '../utils/roles';
import { RowActions } from '../components/RowActions';
import { getApiErrorMessage } from '../utils/apiError';
import { PasswordInput } from '../components/PasswordInput';
import { AppDropdown, DropdownOption } from '../components/AppDropdown';

const toRoleOptions = (roles: AdminRole[]): DropdownOption[] => (
  roles.map((adminRole) => ({
    value: adminRole,
    label: getRoleLabel(adminRole)
  }))
);

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
  const assignableRoleOptions = useMemo(() => toRoleOptions(assignableRoles), [assignableRoles]);
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
    <div className="min-w-0">
      <PageHeader
        title="Admin Users"
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      <div className="mb-6 flex">
        <IconButton
          type="button"
          disabled={!canCreateAdminUsers}
          tooltip={canCreateAdminUsers ? 'Create admin' : writeTooltip ?? 'Owner or Admin required'}
          aria-label="Create admin"
          onClick={() => {
            setEditingAdmin(null);
            resetCreateForm();
            setIsCreateOpen((open) => !open);
          }}
        >
          <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
        </IconButton>
      </div>

      {isCreateOpen && (
        <form onSubmit={handleCreateAdmin} className="mb-8 grid gap-4 py-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_auto] md:items-end">
          <label className="block text-sm text-slate-500">
            Username
            <input
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="mt-2 quiet-field"
              required
            />
          </label>
          <label className="block text-sm text-slate-500">
            Password
            <PasswordInput
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              wrapperClassName="mt-2"
              inputClassName="quiet-field"
              required
            />
          </label>
          <div className="block text-sm text-slate-500">
            <span>Role</span>
            <AppDropdown
              value={newRole}
              onChange={(value) => setNewRole(value as AdminRole)}
              options={assignableRoleOptions}
              ariaLabel="Select admin role"
              className="mt-2"
            />
          </div>
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
          <div className="block min-w-48 text-sm text-slate-500">
            <span>Role</span>
            <AppDropdown
              value={selectedRole}
              onChange={(value) => setSelectedRole(value as AdminRole)}
              options={toRoleOptions(getEditableRoles(editingAdmin.role))}
              ariaLabel="Select replacement admin role"
              className="mt-2"
            />
          </div>
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
              <tbody>
                {adminUsers.map((adminUser) => {
                  const canManageRow = canManageAdminUser(role, adminUser.role);
                  const editableRoles = getEditableRoles(adminUser.role);
                  const canChangeRole = editableRoles.length > 1;
                  const isCurrentUser = adminUser.username === username;
                  const rowAccessTitle = canManageRow ? undefined : 'Owner required';

                  return (
                    <tr key={adminUser.id ?? adminUser.username} className="transition-colors hover:bg-slate-900/25">
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-slate-100">{adminUser.username}</span>
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
