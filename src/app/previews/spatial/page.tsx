import Link from "next/link";
import { ArrowLeft, Target, Users, TrendingUp } from "lucide-react";

export default function SpatialPreview() {
  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative">
      {/* Cinematic background blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-xl flex items-center px-8 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/previews" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-lg font-medium tracking-tight">Golden Fork</div>
        </div>
        <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-1.5 rounded-full text-sm font-medium transition-all backdrop-blur-md">
          New Lead
        </button>
      </header>
      
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-8 relative z-10">
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Active Pipeline", value: "$450,000", change: "+12%" },
            { label: "Conversion Rate", value: "24.5%", change: "+2.1%" },
            { label: "Active Reps", value: "12", change: "0" }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
              <div className="text-white/50 text-sm font-medium mb-3">{stat.label}</div>
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-semibold tracking-tight">{stat.value}</div>
                <div className={`text-sm font-medium ${stat.change.startsWith("+") ? "text-emerald-400" : "text-white/30"}`}>{stat.change}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">Recent Leads</h2>
            <button className="text-sm text-white/50 hover:text-white transition-colors">View All</button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-white/50 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Value</th>
                <th className="px-6 py-4 font-medium">Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[1,2,3,4].map(i => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">Enterprise Deal #{i}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/70">$15,000</td>
                  <td className="px-6 py-4 text-white/70">John Doe</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
