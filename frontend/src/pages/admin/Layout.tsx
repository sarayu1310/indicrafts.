import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, ShoppingCart, ShieldCheck, Menu, Users as UsersIcon, Store, Star } from 'lucide-react';

const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();

    const [collapsed, setCollapsed] = React.useState(false);

    return (
        <div className={`min-h-screen grid grid-rows-[56px_1fr] ${collapsed ? 'grid-cols-[72px_1fr]' : 'grid-cols-[260px_1fr]'}`}>
            {/* Topbar */}
            <header className="col-span-2 flex items-center justify-between px-4 border-b">
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-md hover:bg-muted" onClick={() => setCollapsed((v) => !v)} aria-label="Toggle sidebar">
                        <Menu size={18} />
                    </button>
                    <Link to="/admin" className="font-semibold">IndiCrafts Admin</Link>
                </div>
                <div className="text-sm flex items-center gap-3">
                    <span>{user?.name}</span>
                    <button onClick={logout} className="underline">Logout</button>
                </div>
            </header>

            {/* Sidebar (Left) */}
            <aside className="border-r p-3 sticky top-[56px] h-[calc(100vh-56px)] overflow-auto">
                <nav className="space-y-4">
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
                    >
                        <LayoutDashboard size={18} />
                        <span className={`${collapsed ? 'hidden' : 'inline'}`}>Dashboard</span>
                    </NavLink>

                    <div className="space-y-1">
                        <div className={`px-3 text-xs uppercase text-muted-foreground ${collapsed ? 'hidden' : 'block'}`}>Commerce</div>
                        <NavLink
                            to="/admin/orders"
                            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
                        >
                            <ShoppingCart size={18} />
                            <span className={`${collapsed ? 'hidden' : 'inline'}`}>Orders</span>
                        </NavLink>
                        <NavLink
                            to="/admin/approvals"
                            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
                        >
                            <ShieldCheck size={18} />
                            <span className={`${collapsed ? 'hidden' : 'inline'}`}>Approvals</span>
                        </NavLink>
                        <NavLink
                            to="/admin/reviews"
                            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
                        >
                            <Star size={18} />
                            <span className={`${collapsed ? 'hidden' : 'inline'}`}>Reviews</span>
                        </NavLink>
                        <div className={`px-3 text-xs uppercase text-muted-foreground mt-3 ${collapsed ? 'hidden' : 'block'}`}>Directory</div>
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
                        >
                            <UsersIcon size={18} />
                            <span className={`${collapsed ? 'hidden' : 'inline'}`}>Customers</span>
                        </NavLink>
                        <NavLink
                            to="/admin/producers"
                            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-muted font-medium' : 'hover:bg-muted/50'}`}
                        >
                            <Store size={18} />
                            <span className={`${collapsed ? 'hidden' : 'inline'}`}>Producers</span>
                        </NavLink>
                    </div>
                </nav>
            </aside>

            {/* Content */}
            <main className="p-4 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;


