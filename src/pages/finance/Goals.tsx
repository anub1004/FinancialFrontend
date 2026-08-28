import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ApiConfig } from "../../config/apiconfig";
import toast from "react-hot-toast";
import {
  Plus, Pencil, Trash2, X, Loader, Target, TrendingUp,
  CheckCircle, AlertCircle, DollarSign, Sparkles
} from "lucide-react";
import FeatureGate from "../../Component/FeatureGate";

interface GoalItem {
  goalId: string;
  title: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  deadline: string;
  status: number;
  statusName: string;
  icon: string | null;
  color: string | null;
  currency: string;
  daysRemaining: number;
  monthlyTargetToComplete: number | null;
  createdAt: string;
  updatedAt: string;
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"];
const ICONS = ["🎯", "🏠", "✈️", "🚗", "💰", "📚", "💍", "🏥", "👶", "🎓", "🛍️", "💻", "⚡"];
const COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

function Goals() {
  const { authState } = useAuth();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const [formData, setFormData] = useState({
    title: "", description: "", targetAmount: "", currentAmount: "0",
    deadline: "", icon: "🎯", color: "#6366f1", currency: "INR",
  });

  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" };

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/goals${params}`, { credentials: "include", headers });
      if (res.ok) setGoals(await res.json());
    } catch { toast.error("Failed to load goals"); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchGoals(); }, [filterStatus]);

  const resetForm = () => {
    setFormData({ title: "", description: "", targetAmount: "", currentAmount: "0", deadline: "", icon: "🎯", color: "#6366f1", currency: "INR" });
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (g: GoalItem) => {
    setFormData({
      title: g.title, description: g.description || "", targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(), deadline: g.deadline.split("T")[0],
      icon: g.icon || "🎯", color: g.color || "#6366f1", currency: g.currency,
    });
    setEditingId(g.goalId);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.targetAmount || !formData.deadline) { toast.error("Title, target amount, and deadline required"); return; }
    try {
      const url = editingId ? `${ApiConfig.Api_Base_Url}api/goals/${editingId}` : `${ApiConfig.Api_Base_Url}api/goals`;
      const body: Record<string, any> = {
        title: formData.title, targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline, icon: formData.icon, color: formData.color, currency: formData.currency,
      };
      if (formData.description) body.description = formData.description;
      if (!editingId) body.currentAmount = parseFloat(formData.currentAmount) || 0;

      const res = await fetch(url, { method: editingId ? "PUT" : "POST", credentials: "include", headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(editingId ? "Goal updated!" : "Goal created!");
      setShowModal(false); resetForm(); fetchGoals();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId || !contributeAmount) return;
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/goals/${contributeGoalId}/contribute`, {
        method: "POST", credentials: "include", headers, body: JSON.stringify({ amount: parseFloat(contributeAmount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Contribution added!");
      setShowContributeModal(false); setContributeAmount(""); setContributeGoalId(null); fetchGoals();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleStatusChange = async (goalId: string, status: number) => {
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/goals/${goalId}/status`, {
        method: "POST", credentials: "include", headers, body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Status updated!"); fetchGoals();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    try {
      const res = await fetch(`${ApiConfig.Api_Base_Url}api/goals/${id}`, { method: "DELETE", credentials: "include", headers });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Goal deleted"); fetchGoals();
    } catch (err: any) { toast.error(err.message); }
  };

  const fmt = (amount: number, currency: string = "INR") =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const statusBadge = (statusName: string) => {
    const styles: Record<string, string> = {
      NotStarted: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      InProgress: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
      Completed: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
      Failed: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    };
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${styles[statusName] || styles.NotStarted}`}>{statusName.replace(/([A-Z])/g, ' $1').trim()}</span>;
  };

  // Stats
  const completedGoals = goals.filter(g => g.statusName === "Completed").length;
  const inProgressGoals = goals.filter(g => g.statusName === "InProgress" || g.statusName === "NotStarted").length;
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  if (authState.loading) return <div className="flex items-center justify-center h-64"><Loader className="animate-spin text-violet-500 w-10 h-10" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">Financial Goals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set, track, and achieve your financial targets</p>
        </div>
        <button onClick={openCreate} className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30"><Target className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
            <div><div className="text-xs text-gray-400 uppercase tracking-wider">Active Goals</div><div className="text-lg font-bold text-gray-800 dark:text-gray-100">{inProgressGoals}</div></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30"><CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div><div className="text-xs text-gray-400 uppercase tracking-wider">Completed</div><div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completedGoals}</div></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30"><TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" /></div>
            <div><div className="text-xs text-gray-400 uppercase tracking-wider">Total Saved</div><div className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmt(totalSaved)}</div></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30"><DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
            <div><div className="text-xs text-gray-400 uppercase tracking-wider">Total Target</div><div className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmt(totalTarget)}</div></div>
          </div>
        </div>
      </div>

      {/* Goal Recommendations — requires 'goal_recommendations' (Advanced+) */}
      <FeatureGate feature="goal_recommendations" fallback={null}>
        <div className="mb-6 p-4 rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-200">🎯 Smart Goal Recommendations</h3>
              <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mt-0.5">
                Based on your spending patterns, consider setting an emergency fund goal of {fmt(totalTarget > 0 ? totalTarget * 0.2 : 50000)} — you're saving {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}% toward your targets!
              </p>
            </div>
          </div>
        </div>
      </FeatureGate>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["", "InProgress", "NotStarted", "Completed", "Failed"].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filterStatus === s
                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}>
            {s === "" ? "All" : s.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader className="animate-spin text-violet-500 w-8 h-8" /></div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {goals.map((g) => (
            <div key={g.goalId} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Colored top stripe */}
              <div className="h-1.5" style={{ backgroundColor: g.color || "#6366f1" }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{g.icon || "🎯"}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{g.title}</h3>
                      {g.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{g.description}</p>}
                    </div>
                  </div>
                  {statusBadge(g.statusName)}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400">{fmt(g.currentAmount, g.currency)} of {fmt(g.targetAmount, g.currency)}</span>
                    <span className="font-semibold" style={{ color: g.color || "#6366f1" }}>{g.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, g.progressPercentage)}%`, backgroundColor: g.color || "#6366f1" }}
                    />
                  </div>
                </div>

                {/* Deadline & monthly target */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>
                    {g.daysRemaining > 0
                      ? `${g.daysRemaining} days left`
                      : g.statusName === "Completed" ? "Completed" : "Overdue"}
                  </span>
                  {g.monthlyTargetToComplete && g.statusName !== "Completed" && (
                    <span>{fmt(g.monthlyTargetToComplete, g.currency)}/mo needed</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  {g.statusName !== "Completed" && g.statusName !== "Failed" && (
                    <button
                      onClick={() => { setContributeGoalId(g.goalId); setContributeAmount(""); setShowContributeModal(true); }}
                      className="flex-1 py-2 text-xs font-medium text-white rounded-lg shadow-sm transition-colors"
                      style={{ backgroundColor: g.color || "#6366f1" }}
                    >
                      <DollarSign className="w-3.5 h-3.5 inline mr-1" />Add Funds
                    </button>
                  )}
                  <button onClick={() => openEdit(g)} className="p-2 text-gray-400 hover:text-violet-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(g.goalId)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 className="w-4 h-4" /></button>
                  {g.statusName === "InProgress" && (
                    <button onClick={() => handleStatusChange(g.goalId, 3)} className="p-2 text-gray-400 hover:text-emerald-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Mark Complete"><CheckCircle className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-16 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-4"><Target className="w-7 h-7 text-gray-400" /></div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No goals yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first financial goal to start saving.</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors"><Plus className="w-4 h-4" />Create Your First Goal</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editingId ? "Edit Goal" : "New Goal"}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Title</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Emergency Fund"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Description <span className="text-gray-300 dark:text-gray-500">(optional)</span></label>
                <input type="text" value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} placeholder="Why is this goal important?"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Target Amount</label>
                  <input type="number" step="0.01" required value={formData.targetAmount} onChange={(e) => setFormData(f => ({ ...f, targetAmount: e.target.value }))} placeholder="500000"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Currency</label>
                  <select value={formData.currency} onChange={(e) => setFormData(f => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Starting Amount <span className="text-gray-300 dark:text-gray-500">(optional)</span></label>
                  <input type="number" step="0.01" value={formData.currentAmount} onChange={(e) => setFormData(f => ({ ...f, currentAmount: e.target.value }))} placeholder="0"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Deadline</label>
                <input type="date" required value={formData.deadline} onChange={(e) => setFormData(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
                    <button key={i} type="button" onClick={() => setFormData(f => ({ ...f, icon: i }))}
                      className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center border transition-colors ${formData.icon === i ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setFormData(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c ? "border-gray-800 dark:border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="flex-1 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">{editingId ? "Update Goal" : "Create Goal"}</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Add Funds</h3>
              <button onClick={() => setShowContributeModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleContribute} className="p-6 space-y-5">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 block">Contribution Amount</label>
                <input type="number" step="0.01" required value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} placeholder="0.00" autoFocus
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
              </div>
              <button type="submit" className="w-full py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors">Contribute</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default Goals;
