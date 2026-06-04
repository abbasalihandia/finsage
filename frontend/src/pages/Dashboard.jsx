import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { getSummary, getTransactions, addTransaction, deleteTransaction, getMonthlyTrends,  uploadBankStatement } from "../api/api";

const COLORS = ["#0f3460", "#e94560", "#f5a623", "#2ecc71", "#9b59b6", "#1abc9c"];
const CATEGORIES = ["food", "rent", "transport", "shopping", "entertainment", "health", "salary", "freelance", "other"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0, category_spending: {} });
  const [transactions, setTransactions] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", amount: "", type: "expense", category: "food", note: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, transRes, trendsRes] = await Promise.all([
        getSummary(),
        getTransactions(),
        getMonthlyTrends()
      ]);
      setSummary(summaryRes.data);
      setTransactions(transRes.data);
      setMonthlyTrends(trendsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      await addTransaction({ ...form, amount: parseFloat(form.amount) });
      setForm({ title: "", amount: "", type: "expense", category: "food", note: "" });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add transaction");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pieData = Object.entries(summary.category_spending).map(([name, value]) => ({
    name, value
  }));

  const exportToCSV = () => {
  if (transactions.length === 0) {
    alert("No transactions to export!");
    return;
  }

  const headers = ["Title", "Category", "Type", "Amount", "Date", "Note"];
  const rows = transactions.map(t => [
    t.title,
    t.category,
    t.type,
    t.amount,
    new Date(t.date).toLocaleDateString(),
    t.note || ""
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "finsage_transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
};
 const handlePDFUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);
  setUploadMessage("");

  try {
    const res = await uploadBankStatement(file);
    setUploadMessage(`✅ ${res.data.message}`);
    fetchData(); // Refresh dashboard
  } catch (err) {
    setUploadMessage("❌ " + (err.response?.data?.detail || "Upload failed"));
  } finally {
    setUploading(false);
  }
};

if (loading) return <div style={styles.loading}>Loading your finances...</div>;

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.navbar}>
        <h1 style={styles.navLogo}>💰 FinSage</h1>
        <div style={styles.navRight}>
          <button style={styles.chatNavBtn} onClick={() => navigate("/chat")}>
            🤖 AI Coach
          </button>
          <span style={styles.navUser}>👋 {user?.name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.container}>

        {/* Summary Cards */}
        <div style={styles.cardRow}>
          <div style={{ ...styles.card, borderTop: "4px solid #2ecc71" }}>
            <p style={styles.cardLabel}>Total Income</p>
            <p style={{ ...styles.cardValue, color: "#2ecc71" }}>₹{summary.total_income.toLocaleString()}</p>
          </div>
          <div style={{ ...styles.card, borderTop: "4px solid #e94560" }}>
            <p style={styles.cardLabel}>Total Expenses</p>
            <p style={{ ...styles.cardValue, color: "#e94560" }}>₹{summary.total_expense.toLocaleString()}</p>
          </div>
          <div style={{ ...styles.card, borderTop: "4px solid #0f3460" }}>
            <p style={styles.cardLabel}>Balance</p>
            <p style={{ ...styles.cardValue, color: "#0f3460" }}>₹{summary.balance.toLocaleString()}</p>
          </div>
        </div>

        {/* Pie Chart + Add Transaction */}
        <div style={styles.mainGrid}>

          {/* Add Transaction Form */}
          <div style={styles.formCard}>
            <h2 style={styles.sectionTitle}>Add Transaction</h2>
            <form onSubmit={handleAddTransaction}>
              <input
                style={styles.input}
                placeholder="Title (e.g. Salary, Groceries)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                style={styles.input}
                type="number"
                placeholder="Amount (₹)"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
              <select
                style={styles.input}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select
                style={styles.input}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
              <input
                style={styles.input}
                placeholder="Note (optional)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.addBtn} type="submit" disabled={adding}>
                {adding ? "Adding..." : "+ Add Transaction"}
              </button>
            </form>
          </div>

          {/* Pie Chart */}
          <div style={styles.chartCard}>
            <h2 style={styles.sectionTitle}>Spending by Category</h2>
            {pieData.length === 0 ? (
              <p style={styles.emptyText}>No expenses yet. Add some transactions!</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Trends Bar Chart */}
        <div style={{ ...styles.tableCard, marginBottom: "2rem" }}>
          <h2 style={styles.sectionTitle}>Monthly Income vs Expenses</h2>
          {monthlyTrends.length === 0 ? (
            <p style={styles.emptyText}>No data yet. Add transactions to see trends!</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#2ecc71" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#e94560" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* PDF Upload Card */}
<div style={styles.uploadCard}>
  <div style={styles.uploadLeft}>
    <h2 style={styles.sectionTitle}>📄 Import Bank Statement</h2>
    <p style={styles.uploadDesc}>
      Upload your bank statement PDF and AI will automatically extract and categorize all transactions.
    </p>
  </div>
  <div style={styles.uploadRight}>
    <label style={styles.uploadLabel}>
      {uploading ? "Processing..." : "⬆ Upload PDF"}
      <input
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={handlePDFUpload}
        disabled={uploading}
      />
    </label>
    {uploadMessage && (
      <p style={{
        marginTop: "0.5rem", fontSize: "0.85rem",
        color: uploadMessage.startsWith("✅") ? "#2ecc71" : "#e94560"
      }}>
        {uploadMessage}
      </p>
    )}
  </div>
</div>

        {/* Transactions Table */}
        <div style={styles.tableCard}>
          <h2 style={styles.sectionTitle}>Recent Transactions</h2>
          <button style={styles.exportBtn} onClick={exportToCSV}>
            ⬇ Export CSV
    </button>
          {transactions.length === 0 ? (
            <p style={styles.emptyText}>No transactions yet.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} style={styles.tableRow}>
                    <td style={styles.td}>{t.title}</td>
                    <td style={styles.td}>{t.category}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        background: t.type === "income" ? "#d4edda" : "#fde8e8",
                        color: t.type === "income" ? "#2ecc71" : "#e94560",
                      }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: "600", color: t.type === "income" ? "#2ecc71" : "#e94560" }}>
                      {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString()}
                    </td>
                    <td style={styles.td}>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f0f2f5" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "1.2rem" },
  navbar: {
    background: "#1a1a2e", color: "white", padding: "1rem 2rem",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  navLogo: { fontSize: "1.4rem", fontWeight: "700" },
  navRight: { display: "flex", alignItems: "center", gap: "1rem" },
  navUser: { fontSize: "0.95rem" },
  chatNavBtn: {
    background: "transparent", color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "0.4rem 1rem", borderRadius: "6px", fontWeight: "500",
  },
  logoutBtn: {
    background: "#e94560", color: "white", border: "none",
    padding: "0.4rem 1rem", borderRadius: "6px", fontWeight: "600",
  },
  container: { maxWidth: "1200px", margin: "0 auto", padding: "2rem" },
  cardRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "2rem" },
  card: {
    background: "white", borderRadius: "12px", padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
  },
  cardLabel: { color: "#888", fontSize: "0.9rem", marginBottom: "0.5rem" },
  cardValue: { fontSize: "1.8rem", fontWeight: "700" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" },
  formCard: { background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  chartCard: { background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  tableCard: { background: "white", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  sectionTitle: { fontSize: "1.1rem", fontWeight: "600", color: "#1a1a2e" },
  input: {
    width: "100%", padding: "0.7rem 1rem", borderRadius: "8px",
    border: "1.5px solid #e0e0e0", fontSize: "0.95rem", marginBottom: "0.8rem",
    outline: "none",
  },
  addBtn: {
    width: "100%", padding: "0.8rem", background: "#0f3460",
    color: "white", border: "none", borderRadius: "8px",
    fontSize: "1rem", fontWeight: "600",
  },
  tableTitleRow: {
  display: "flex", justifyContent: "space-between",
  alignItems: "center", marginBottom: "1.2rem",
  },
  uploadCard: {
  background: "white", borderRadius: "12px", padding: "1.5rem",
  boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: "2rem",
  display: "flex", justifyContent: "space-between", alignItems: "center",
},
uploadLeft: { flex: 1 },
uploadDesc: { color: "#888", fontSize: "0.9rem", marginTop: "0.3rem" },
uploadRight: { textAlign: "right" },
uploadLabel: {
  background: "#0f3460", color: "white", padding: "0.7rem 1.5rem",
  borderRadius: "8px", fontWeight: "600", fontSize: "0.9rem",
  cursor: "pointer", display: "inline-block",
},
 exportBtn: {
  background: "#f0f2f5", color: "#1a1a2e", border: "none",
  padding: "0.4rem 1rem", borderRadius: "6px",
  fontWeight: "600", fontSize: "0.85rem",
  },
  error: { color: "#e94560", fontSize: "0.85rem", marginBottom: "0.8rem" },
  emptyText: { color: "#aaa", textAlign: "center", padding: "2rem 0" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { background: "#f8f9fa" },
  th: { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.85rem", color: "#666", fontWeight: "600" },
  tableRow: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: "0.75rem 1rem", fontSize: "0.9rem" },
  typeBadge: { padding: "0.2rem 0.7rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600" },
  deleteBtn: {
    background: "#fde8e8", color: "#e94560", border: "none",
    padding: "0.3rem 0.7rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600",
  },
};