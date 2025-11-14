import React, { useEffect, useState } from 'react';
import api from '@/services/api';

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await api.getAdminUsers({ page, limit, role: 'customer', search: search || undefined });
                setUsers((res as any).users || []);
                setTotal((res as any).total || 0);
            } catch (e: any) {
                setError(e?.message || 'Failed to load customers');
            } finally {
                setLoading(false);
            }
        })();
    }, [page, limit, search]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Customers</h1>
                <div>
                    <input
                        className="border rounded px-3 py-1 text-sm"
                        placeholder="Search by name or email"
                        value={search}
                        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                    />
                </div>
            </div>

            <div className="overflow-auto rounded-xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-3">First Name</th>
                            <th className="text-left p-3">Last Name</th>
                            <th className="text-left p-3">Display Name</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-left p-3">Email Verified</th>
                            <th className="text-left p-3">Role</th>
                            <th className="text-left p-3">Phone</th>
                            <th className="text-left p-3">Addresses</th>
                            <th className="text-left p-3">Primary Address</th>
                            <th className="text-left p-3">Created</th>
                            <th className="text-left p-3">Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td className="p-4" colSpan={11}>Loading…</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td className="p-4" colSpan={11}>No customers found</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u._id} className="border-t">
                                    <td className="p-3">{u.firstName || '—'}</td>
                                    <td className="p-3">{u.lastName || '—'}</td>
                                    <td className="p-3">{u.name || (u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—')}</td>
                                    <td className="p-3">{u.email}</td>
                                    <td className="p-3">{u.isEmailVerified ? 'Yes' : 'No'}</td>
                                    <td className="p-3">{u.role}</td>
                                    <td className="p-3">{u.phone || '—'}</td>
                                    <td className="p-3">{Array.isArray(u.addresses) ? u.addresses.length : 0}</td>
                                    <td className="p-3">{Array.isArray(u.addresses) && u.addresses[0] ? `${u.addresses[0].addressLine1 || ''} ${u.addresses[0].addressLine2 || ''}, ${u.addresses[0].city || ''}, ${u.addresses[0].state || ''} ${u.addresses[0].postalCode || ''}`.replace(/\s+,/g, '').trim() : '—'}</td>
                                    <td className="p-3">{u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}</td>
                                    <td className="p-3">{u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between text-sm">
                <div>{total} total</div>
                <div className="flex items-center gap-2">
                    <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                    <div>Page {page}</div>
                    <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
    );
};

export default UsersPage;


