'use client';

import { useState, useEffect } from 'react';
import { roleService, Role, Permission, permissionService } from '../../../services/role.service';
import { Plus, Trash2, Shield, Loader2, Check, X } from 'lucide-react';

export default function RoleManagementPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [rolesData, permissionsData] = await Promise.all([
                roleService.getAll(),
                permissionService.getAll()
            ]);
            setRoles(rolesData);
            setPermissions(permissionsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        try {
            // Assuming a default organisation_id for now or getting it from context/service if needed.
            // For this implementation, we'll rely on the backend to pick it up or passed via context if strictly enforced.
            // However, the CreateRoleDto requires organisation_id.
            // In a real app we'd get this from the auth context.
            // For demo purposes, we might need to hardcode specific behavior or fetch the org first.
            // Let's assume the user is an admin of the first org found or similar logic used in previous page.
            // But creating a role usually requires an org ID.
            // Let's just pass a placeholder or handle it if the service handles context.
            // Looking at role.service.ts, DTO requires organisation_id.
            // I'll grab the id from the first role for now as a fallback or assume context.

            const orgId = roles.length > 0 ? roles[0].organisation_id : 'default-org-id';

            const newRole = await roleService.create({
                name: newRoleName,
                organisation_id: orgId
            });
            setRoles([...roles, newRole]);
            setNewRoleName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create role:', error);
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm('Are you sure you want to delete this role?')) return;
        try {
            await roleService.delete(id);
            setRoles(roles.filter(role => role.id !== id));
            if (selectedRole?.id === id) {
                setSelectedRole(null);
            }
        } catch (error) {
            console.error('Failed to delete role:', error);
        }
    };

    const handleSelectRole = async (role: Role) => {
        setSelectedRole(role);
        setIsSavingPermissions(true);
        try {
            const perms = await roleService.getRolePermissions(role.id);
            setRolePermissions(perms.map(p => p.id));
        } catch (error) {
            console.error('Failed to load role permissions:', error);
        } finally {
            setIsSavingPermissions(false);
        }
    };

    const togglePermission = (permissionId: string) => {
        setRolePermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const savePermissions = async () => {
        if (!selectedRole) return;
        setIsSavingPermissions(true);
        try {
            await roleService.assignPermissions(selectedRole.id, rolePermissions);
            // Optional: show success message
        } catch (error) {
            console.error('Failed to save permissions:', error);
        } finally {
            setIsSavingPermissions(false);
        }
    };

    // Group permissions by resource for better UI
    const groupedPermissions = permissions.reduce((acc, curr) => {
        if (!acc[curr.resource]) acc[curr.resource] = [];
        acc[curr.resource].push(curr);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
                    <p className="text-gray-500 mt-1">Manage user roles and assign permissions</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Role
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={handleCreateRole} className="flex gap-4">
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="Enter role name (e.g. Content Moderator)"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false);
                                setNewRoleName('');
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Roles List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-1">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-700">Roles</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                onClick={() => handleSelectRole(role)}
                                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'
                                    }`}
                            >
                                <span className={`font-medium ${selectedRole?.id === role.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                    {role.name}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRole(role.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2 flex flex-col h-[600px]">
                    {selectedRole ? (
                        <>
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Permissions for {selectedRole.name}</h2>
                                    <p className="text-sm text-gray-500">Configure what this role can do</p>
                                </div>
                                <button
                                    onClick={savePermissions}
                                    disabled={isSavingPermissions}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {isSavingPermissions ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Save Changes
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                                    <div key={resource}>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                            {resource}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {perms.map((perm) => {
                                                const isSelected = rolePermissions.includes(perm.id);
                                                return (
                                                    <div
                                                        key={perm.id}
                                                        onClick={() => togglePermission(perm.id)}
                                                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-100 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                                            }`}>
                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                                {perm.action}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {perm.resource}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                            <Shield className="w-16 h-16 mb-4 text-gray-200" />
                            <p className="text-lg font-medium text-gray-500">Select a role to manage permissions</p>
                            <p className="text-sm">Choose a role from the list on the left to view and edit its capabilities.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
