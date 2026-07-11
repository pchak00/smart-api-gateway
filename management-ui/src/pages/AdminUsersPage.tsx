import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { UserCog } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PageTitleCreateAction, PrimaryButton, SecondaryButton } from '../components/Button';
import { EmptyState, PageHeader } from '../components/PageShell';
import { AdminRole, AdminUserDto } from '../types';
import { canManageAdminUser, getAssignableRoles, getRoleLabel, isOwnerRole, isSuperAdminRole } from '../utils/roles';
import { RowActions } from '../components/RowActions';
import { getApiErrorMessage } from '../utils/apiError';
import { PasswordInput } from '../components/PasswordInput';
import { AppDropdown, DropdownOption } from '../components/AppDropdown';
import { evaluateAdminPassword, PasswordPolicyResult, PasswordStrength } from '../utils/passwordPolicy';

const toRoleOptions = (roles: AdminRole[]): DropdownOption[] => (
  roles.map((adminRole) => ({
    value: adminRole,
    label: getRoleLabel(adminRole)
  }))
);

const strengthFillClass: Record<PasswordStrength, string> = {
  weak: 'bg-slate-700',
  fair: 'bg-amber-400/75',
  strong: 'bg-cyan-400/75',
  'very-strong': 'bg-emerald-400/75'
};

const strengthTextClass: Record<PasswordStrength, string> = {
  weak: 'text-slate-500',
  fair: 'text-amber-300/85',
  strong: 'text-cyan-300/85',
  'very-strong': 'text-emerald-300/85'
};

const strengthWidthClass: Record<PasswordStrength, string> = {
  weak: 'w-1/4',
  fair: 'w-1/2',
  strong: 'w-3/4',
  'very-strong': 'w-full'
};

const PasswordStrengthHint: React.FC<{ policy: PasswordPolicyResult }> = ({ policy }) => (
  <div aria-live="polite">
    <div className="h-1 overflow-hidden rounded-full bg-slate-900/80">
      <div
        className={`h-full rounded-full transition-all ${strengthFillClass[policy.strength]} ${strengthWidthClass[policy.strength]}`}
      />
    </div>
    <p className="mt-1 text-xs leading-5 text-slate-500">
      <span className={`font-medium ${strengthTextClass[policy.strength]}`}>{policy.label}</span>
      <span className="mx-1 text-slate-700">/</span>
      <span>{policy.feedback}</span>
    </p>
  </div>
);

const AdminFormField: React.FC<{
  label: string;
  children: React.ReactNode;
  as?: 'label' | 'div';
  className?: string;
}> = ({ label, children, as: Component = 'label', className = '' }) => (
  <Component className={`block min-w-0 text-sm text-slate-500 ${className}`}>
    <span>{label}</span>
    {children}
  </Component>
);

interface AdminPasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  policy?: PasswordPolicyResult;
  support?: React.ReactNode;
}

const AdminPasswordField: React.FC<AdminPasswordFieldProps> = ({
  label,
  policy,
  support,
  ...props
}) => (
  <AdminFormField label={label}>
    <PasswordInput
      {...props}
      wrapperClassName="mt-2"
      inputClassName="quiet-field"
    />
    <div className="min-h-[3.25rem] pt-2">
      {policy ? <PasswordStrengthHint policy={policy} /> : support}
    </div>
  </AdminFormField>
);

const AdminFormActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-7">
    {children}
  </div>
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
  const [resettingAdmin, setResettingAdmin] = useState<AdminUserDto | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('READ_ONLY_ADMIN');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('READ_ONLY_ADMIN');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const assignableRoles = useMemo(() => getAssignableRoles(role), [role]);
  const assignableRoleOptions = useMemo(() => toRoleOptions(assignableRoles), [assignableRoles]);
  const canCreateAdminUsers = assignableRoles.length > 0;
  const writeTooltip = !canCreateAdminUsers ? 'Owner or Admin required' : undefined;
  const ownerCount = useMemo(
    () => adminUsers.filter((adminUser) => isOwnerRole(adminUser.role)).length,
    [adminUsers]
  );
  const createPasswordPolicy = useMemo(
    () => evaluateAdminPassword(newUsername, newPassword),
    [newUsername, newPassword]
  );
  const resetPasswordPolicy = useMemo(
    () => evaluateAdminPassword(resettingAdmin?.username, resetPassword),
    [resettingAdmin?.username, resetPassword]
  );
  const isResetConfirmationValid = resetConfirmPassword.length > 0 && resetPassword === resetConfirmPassword;

  const loadAdminUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setAdminUsers(data);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to load admin users:', error);
      setAdminUsers([]);
      setErrorMessage('Backend admins are unavailable right now.');
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

    if (!createPasswordPolicy.valid) {
      showToast({ message: createPasswordPolicy.feedback, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createAdminUser({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole
      });
      showToast({ message: 'Admin created.', type: 'success' });
      resetCreateForm();
      setIsCreateOpen(false);
      await loadAdminUsers();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not create admin.'),
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
    setResettingAdmin(null);
    setSelectedRole(editableRoles.includes(adminUser.role as AdminRole)
      ? adminUser.role as AdminRole
      : editableRoles[editableRoles.length - 1]);
  };

  const startPasswordReset = (adminUser: AdminUserDto) => {
    if (!adminUser.id || !canManageAdminUser(role, adminUser.role)) return;

    setResettingAdmin(adminUser);
    setEditingAdmin(null);
    setIsCreateOpen(false);
    setResetPassword('');
    setResetConfirmPassword('');
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

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!resettingAdmin?.id || !canManageAdminUser(role, resettingAdmin.role)) return;

    if (!resetPassword.trim()) {
      showToast({ message: 'New password is required.', type: 'error' });
      return;
    }

    if (!resetPasswordPolicy.valid) {
      showToast({ message: resetPasswordPolicy.feedback, type: 'error' });
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      showToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetAdminUserPassword(resettingAdmin.id, {
        newPassword: resetPassword,
        confirmPassword: resetConfirmPassword
      });
      showToast({ message: 'Password reset.', type: 'success' });
      setResettingAdmin(null);
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not reset password.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminUser: AdminUserDto) => {
    if (!adminUser.id || !canManageAdminUser(role, adminUser.role)) return;
    if (!window.confirm(`Delete admin ${adminUser.username}?`)) return;

    setIsSubmitting(true);
    try {
      await api.deleteAdminUser(adminUser.id);
      showToast({ message: 'Admin deleted.', type: 'success' });
      await loadAdminUsers();
    } catch (error) {
      showToast({
        message: getApiErrorMessage(error, 'Could not delete admin.'),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-w-0">
      <PageHeader
        title="Admins"
        titleAccessory={
          <PageTitleCreateAction
            type="button"
            disabled={!canCreateAdminUsers}
            tooltip={canCreateAdminUsers ? 'Create admin' : writeTooltip ?? 'Owner or Admin required'}
            aria-label="Create admin"
            onClick={() => {
              setEditingAdmin(null);
              setResettingAdmin(null);
              resetCreateForm();
              setIsCreateOpen((open) => !open);
            }}
          />
        }
        meta={errorMessage ? <span className="text-xs text-slate-500">{errorMessage}</span> : undefined}
      />

      {isCreateOpen && (
        <form onSubmit={handleCreateAdmin} className="mb-8 grid max-w-6xl gap-x-4 gap-y-3 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_auto] lg:items-start">
          <AdminFormField label="Username">
            <input
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              className="mt-2 quiet-field"
              required
            />
          </AdminFormField>
          <AdminPasswordField
            label="Password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            policy={createPasswordPolicy}
            required
            minLength={12}
            maxLength={128}
          />
          <AdminFormField label="Role" as="div">
            <AppDropdown
              value={newRole}
              onChange={(value) => setNewRole(value as AdminRole)}
              options={assignableRoleOptions}
              ariaLabel="Select admin role"
              className="mt-2"
            />
          </AdminFormField>
          <AdminFormActions>
            <PrimaryButton type="submit" disabled={isSubmitting || !createPasswordPolicy.valid}>
              Create
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </SecondaryButton>
          </AdminFormActions>
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

      {resettingAdmin && (
        <form onSubmit={handleResetPassword} className="mb-8 grid max-w-6xl gap-x-4 gap-y-3 py-2 lg:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-56">
            <p className="text-sm font-medium text-slate-100">{resettingAdmin.username}</p>
            <p className="mt-1 text-xs text-slate-500">Reset admin password</p>
          </div>
          <AdminPasswordField
            label="New password"
            value={resetPassword}
            onChange={(event) => setResetPassword(event.target.value)}
            policy={resetPasswordPolicy}
            required
            minLength={12}
            maxLength={128}
          />
          <AdminPasswordField
            label="Confirm password"
            value={resetConfirmPassword}
            onChange={(event) => setResetConfirmPassword(event.target.value)}
            support={resetConfirmPassword.length > 0 && !isResetConfirmationValid ? (
              <p className="text-xs leading-5 text-slate-500" aria-live="polite">Passwords do not match.</p>
            ) : null}
            required
            minLength={12}
            maxLength={128}
          />
          <AdminFormActions>
            <PrimaryButton type="submit" disabled={isSubmitting || !resetPasswordPolicy.valid || !isResetConfirmationValid}>
              Reset
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => {
                setResettingAdmin(null);
                setResetPassword('');
                setResetConfirmPassword('');
              }}
            >
              Cancel
            </SecondaryButton>
          </AdminFormActions>
        </form>
      )}

      <section>
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">Loading admins...</div>
        ) : errorMessage ? (
          <EmptyState
            icon={UserCog}
            title="Admins unavailable"
            description={errorMessage}
          />
        ) : adminUsers.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No admins to show"
            description="Admin records will appear here once the gateway returns them."
          />
        ) : (
          <div className="overflow-x-auto pb-16">
            <table className="w-full min-w-[560px]">
              <thead>
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
                  const isLastOwner = isOwnerRole(adminUser.role) && ownerCount <= 1;
                  const lastOwnerTitle = isLastOwner ? 'At least one owner must remain.' : undefined;
                  const canChangeRole = editableRoles.length > 1 && !isLastOwner;
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
                                title: rowAccessTitle ?? lastOwnerTitle ?? (!canChangeRole ? 'No role changes available' : undefined),
                                onClick: () => startRoleEdit(adminUser)
                              },
                              {
                                label: 'Reset password',
                                disabled: !canManageRow,
                                title: rowAccessTitle,
                                onClick: () => startPasswordReset(adminUser)
                              },
                              {
                                label: 'Delete',
                                tone: 'danger',
                                disabled: !canManageRow || isCurrentUser || isLastOwner,
                                title: rowAccessTitle ?? (isCurrentUser
                                  ? 'You cannot delete your current session user'
                                  : lastOwnerTitle),
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
