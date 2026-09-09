import Link from "next/link";
import { ArrowLeft, Target, Users, TrendingUp } from "lucide-react";

export default function LinearPreview() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#111110] font-sans selection:bg-zinc-200">
      <header className="h-12 border-b border-zinc-200 bg-white flex items-center px-4 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/previews" className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-zinc-900 rounded-sm"></div>
            <span className="font-medium text-sm">Golden Fork</span>
            <span className="text-zinc-300">/</span>
            <span className="text-sm text-zinc-600">Overview</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-[4px] hover:bg-zinc-800 transition-colors">
            New Lead
          </button>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Pipeline", value: "$450k", change: "+12%", icon: Target },
            { label: "Conversion Rate", value: "24.5%", change: "+2.1%", icon: TrendingUp },
            { label: "Active Reps", value: "12", change: "0", icon: Users }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-zinc-200 p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                <stat.icon size={14} className="text-zinc-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{stat.value}</span>
                <span className={`text-xs ${stat.change.startsWith("+") ? "text-emerald-600" : "text-zinc-500"}`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-zinc-200 bg-white rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="border-b border-zinc-200 bg-zinc-50/50 px-4 py-3 flex justify-between items-center">
            <h2 className="text-sm font-medium">Recent Leads</h2>
            <button className="text-xs text-zinc-500 hover:text-zinc-900">View all</button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-zinc-100 text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Value</th>
                <th className="px-4 py-2 font-medium">Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {[1,2,3,4].map(i => (
                <tr key={i} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-4 py-3 font-medium text-zinc-900">Enterprise Deal #{i}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span className="text-zinc-600">Pending</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">$15,000</td>
                  <td className="px-4 py-3 text-zinc-600 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-zinc-200"></div>
                    John Doe
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
