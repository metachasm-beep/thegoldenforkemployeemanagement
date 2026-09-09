import Link from "next/link";
import { ArrowLeft, Target, Users, TrendingUp } from "lucide-react";

export default function EnterprisePreview() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#161616] font-sans">
      <header className="h-14 bg-[#161616] text-white flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/previews" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="font-semibold tracking-wide">IBM-Style Golden Fork</div>
          </div>
        </div>
      </header>
      
      <div className="border-b border-gray-300 bg-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-normal">Manager Dashboard</h1>
        <button className="bg-[#0F62FE] text-white px-4 py-2 text-sm hover:bg-[#0353E9] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#0F62FE]">
          Create Lead
        </button>
      </div>
      
      <main className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-3 gap-0 border border-gray-300 bg-white">
          {[
            { label: "Active Pipeline", value: "$450k", change: "+12%" },
            { label: "Conversion Rate", value: "24.5%", change: "+2.1%" },
            { label: "Active Reps", value: "12", change: "0" }
          ].map((stat, i) => (
            <div key={i} className={`p-4 ${i !== 2 ? "border-r border-gray-300" : ""}`}>
              <div className="text-sm text-[#525252] mb-2">{stat.label}</div>
              <div className="text-3xl font-light mb-1">{stat.value}</div>
              <div className="text-sm text-[#24A148] flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 32 32" fill="currentColor"><path d="M16 4L6 14l1.4 1.4 7.6-7.6v20.2h2V7.8l7.6 7.6L26 14 16 4z"/></svg>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 p-4">
            <h2 className="text-lg font-normal">Recent Leads</h2>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F4F4F4] border-b border-gray-300 text-[#161616]">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold">Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1,2,3,4].map(i => (
                <tr key={i} className="hover:bg-[#E5E5E5] transition-colors">
                  <td className="px-4 py-3 text-[#0F62FE] hover:underline cursor-pointer">Enterprise Deal #{i}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 bg-[#F1F0EE] px-2 py-1 text-xs text-[#161616]">
                      <span className="w-2 h-2 rounded-full bg-[#F1C21B]"></span>
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-3">$15,000</td>
                  <td className="px-4 py-3">John Doe</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
