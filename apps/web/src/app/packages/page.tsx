"use client";
import { useState, useEffect } from "react";
import DashboardShell from "../components/DashboardShell";
import { toast } from "react-hot-toast";

interface Package {
    id: string;
    name: string;
    price: number;
    credits: number;
    active: boolean;
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        credits: "",
        active: true,
    });

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/packages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPackages(data.data);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load packages");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const method = editingPackage ? "PUT" : "POST";
        const url = editingPackage
            ? `${process.env.NEXT_PUBLIC_API_URL}/admin/packages/${editingPackage.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/admin/packages`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price),
                    credits: Number(formData.credits),
                }),
            });

            if (res.ok) {
                toast.success(editingPackage ? "Package updated" : "Package created");
                setShowModal(false);
                setEditingPackage(null);
                setFormData({ name: "", price: "", credits: "", active: true });
                fetchPackages();
            } else {
                const data = await res.json();
                toast.error(data.message || "Operation failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this package?")) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/packages/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                toast.success("Package deleted");
                fetchPackages();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete package");
        }
    };

    const openEdit = (pkg: Package) => {
        setEditingPackage(pkg);
        setFormData({
            name: pkg.name,
            price: pkg.price.toString(),
            credits: pkg.credits.toString(),
            active: pkg.active,
        });
        setShowModal(true);
    };

    return (
        <DashboardShell>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Conversation Packages</h1>
                        <p className="text-slate-400 mt-2">Create and manage credit packages for your users.</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPackage(null);
                            setFormData({ name: "", price: "", credits: "", active: true });
                            setShowModal(true);
                        }}
                        className="px-5 py-2.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-semibold transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                    >
                        Add Package
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 transition-all hover:bg-white/[0.05] hover:border-[#14b8a6]/30 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => openEdit(pkg)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => handleDelete(pkg.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${pkg.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                        {pkg.active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
                                <div className="flex items-baseline gap-1 mt-4">
                                    <span className="text-3xl font-black text-[#14b8a6]">${pkg.price}</span>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-slate-400">
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    <span className="text-sm font-medium">{pkg.credits.toLocaleString()} Conversations</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden transform transition-all shadow-2xl">
                            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h2 className="text-xl font-bold text-white">{editingPackage ? "Edit Package" : "Create Package"}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Package Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#14b8a6] transition"
                                        placeholder="e.g. Pro Growth Pack"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Price (USD)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#14b8a6] transition"
                                            placeholder="99"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Credits</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.credits}
                                            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#14b8a6] transition"
                                            placeholder="1000"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="active"
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6] bg-transparent"
                                    />
                                    <label htmlFor="active" className="text-sm font-medium text-slate-300 cursor-pointer">Package is active for purchase</label>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full mt-4 bg-[#14b8a6] hover:bg-[#0d9488] text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
                                >
                                    {editingPackage ? "Save Changes" : "Create Package"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
