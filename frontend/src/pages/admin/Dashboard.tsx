import React, { useEffect, useState } from 'react';
import api from '@/services/api';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any | null>(null);
    const [shippingSummary, setShippingSummary] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const [statsRes, shippingRes] = await Promise.all([
                    api.getAdminStats(),
                    api.get('/admin/shipping-summary')
                ]);
                setStats((statsRes as any).stats);
                setShippingSummary((shippingRes as any).summary);
            } catch (e: any) {
                setError(e?.message || 'Failed to load stats');
            }
        })();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            {error && <div className="text-red-600 text-sm">{error}</div>}

            {/* Basic Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Customers', value: stats?.usersCount },
                    { label: 'Producers', value: stats?.producersCount },
                    { label: 'Products', value: stats?.productsCount },
                    { label: 'Orders', value: stats?.ordersCount },
                    { label: 'Paid Orders', value: stats?.paidOrdersCount },
                    { label: 'Total Revenue', value: stats?.totalRevenue, prefix: '₹' },
                ].map((c, idx) => (
                    <div key={idx} className="rounded-xl border p-4 bg-gradient-to-br from-white to-slate-50">
                        <div className="text-xs uppercase text-muted-foreground">{c.label}</div>
                        <div className="mt-2 text-3xl font-semibold tracking-tight">
                            {c.prefix}{typeof c.value === 'number' ? (c.label === 'Total Revenue' ? c.value.toFixed(2) : c.value) : '—'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Weight Distribution */}
            {shippingSummary?.distribution?.weight && (
                <div className="rounded-xl border p-4 bg-white">
                    <h2 className="text-xl font-semibold mb-3">Weight Distribution</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(shippingSummary.distribution.weight).map(([category, count]) => (
                            <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">{category}</span>
                                <span className="text-sm text-gray-600">{count as number} products</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Location Distribution */}
            {shippingSummary?.distribution?.location && (
                <div className="rounded-xl border p-4 bg-white">
                    <h2 className="text-xl font-semibold mb-3">Location Distribution</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(shippingSummary.distribution.location).map(([state, count]) => (
                            <div key={state} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">{state}</span>
                                <span className="text-sm text-gray-600">{count as number} products</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;


