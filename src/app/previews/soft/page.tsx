import Link from "next/link";
import { ArrowLeft, Target, Users, TrendingUp } from "lucide-react";

export default function SoftPreview() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      <header className="h-20 flex items-center px-8 justify-between">
        <div className="flex items-center gap-6">
          <Link href="/previews" className="p-3 bg-white rounded-full text-stone-400 hover:text-stone-700 hover:shadow-sm transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-orange-400 rounded-2xl shadow-sm shadow-rose-200"></div>
            <h1 className="font-bold text-xl text-stone-800">Golden Fork</h1>
          </div>
        </div>
        <button className="font-bold bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-md shadow-rose-200 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95">
          + New Lead
        </button>
      </header>
      
      <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-10">
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Active Pipeline", value: "$450k", change: "+12%", icon: Target, color: "bg-blue-100 text-blue-600" },
            { label: "Conversion Rate", value: "24.5%", change: "+2.1%", icon: TrendingUp, color: "bg-emerald-100 text-emerald-600" },
            { label: "Active Reps", value: "12", change: "0", icon: Users, color: "bg-purple-100 text-purple-600" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50">
              <div className="flex justify-between items-center mb-6">
                <div className={`p-3 rounded-2xl ${stat.color}`}>
                  <stat.icon size={20} strokeWidth={2.5} />
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${stat.change.startsWith("+") ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-500"}`}>{stat.change}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-stone-400 font-medium">{stat.label}</h3>
                <div className="text-3xl font-black text-stone-800">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-stone-800">Recent Leads</h2>
            <button className="text-sm font-bold text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors">View all</button>
          </div>
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-stone-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-500 font-bold">#{i}</div>
                  <div>
                    <h4 className="font-bold text-stone-800">Enterprise Deal</h4>
                    <p className="text-sm text-stone-400">$15,000</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="px-4 py-1.5 bg-amber-100 text-amber-700 font-bold text-sm rounded-xl">Pending</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-stone-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
