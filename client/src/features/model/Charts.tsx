import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RunResult } from "./types";
import { clsLabel, money } from "./format";

export function EpChart({ run }: { run: RunResult }) {
  const data = run.ep_curve.map((row) => ({
    rp: row.return_period_years,
    withAI: row.loss_kes,
    proxyOnly: row.baseline_loss_kes,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="rp" tick={{ fill: "#82908d", fontSize: 11 }} label={{ value: "Assumed return period (years)", fill: "#82908d", fontSize: 11, position: "insideBottom", offset: -2 }} />
        <YAxis tickFormatter={(v) => money(Number(v))} tick={{ fill: "#82908d", fontSize: 11 }} width={88} />
        <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: "#172126", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10 }} />
        <Legend />
        <Line type="monotone" dataKey="withAI" stroke="#a7f3d0" strokeWidth={2} name="Loss (current run)" />
        <Line type="monotone" dataKey="proxyOnly" stroke="#67e8f9" strokeDasharray="4 4" strokeWidth={2} name="Proxy only (no drainage rule)" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ClassChart({ run }: { run: RunResult }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={run.by_housing_class.map((r) => ({ ...r, name: clsLabel(r.housing_class) }))} layout="vertical" margin={{ left: 20, right: 12 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
        <XAxis type="number" tickFormatter={(v) => money(Number(v))} tick={{ fill: "#82908d", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: "#82908d", fontSize: 11 }} width={130} />
        <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: "#172126", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10 }} />
        <Bar dataKey="aal_kes" fill="#a7f3d0" name="AAL" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ShapGlobal({ run }: { run: RunResult }) {
  const data = run.explainability.global_shap.slice(0, 8).map((r) => ({
    name: r.feature.replaceAll("_", " "),
    value: r.mean_abs_shap_kes,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 110 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" />
        <XAxis type="number" tickFormatter={(v) => money(Number(v))} tick={{ fill: "#82908d", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: "#82908d", fontSize: 11 }} width={110} />
        <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: "#172126", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10 }} />
        <Bar dataKey="value" fill="#67e8f9" name="Mean |SHAP|" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
