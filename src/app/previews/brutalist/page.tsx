import Link from "next/link";
import { ArrowLeft, Target, Users, TrendingUp } from "lucide-react";

export default function BrutalistPreview() {
  return (
    <div className="min-h-screen bg-[#FFF4E0] text-black font-sans">
      <header className="h-16 bg-[#FF5757] border-b-4 border-black flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/previews" className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div className="font-black text-2xl uppercase tracking-tighter text-white drop-shadow-[2px_2px_0px_black]">
            Golden Fork
          </div>
        </div>
        <button className="font-black uppercase bg-[#FFDE59] text-black border-2 border-black px-6 py-2 shadow-[4px_4px_0px_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
          New Lead
        </button>
      </header>
      
      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-12">
        <div className="grid grid-cols-3 gap-8">
          {[
            { label: "Active Pipeline", value: "$450k", change: "+12%", bg: "bg-[#5CE1E6]" },
            { label: "Conversion Rate", value: "24.5%", change: "+2.1%", bg: "bg-[#7ED957]" },
            { label: "Active Reps", value: "12", change: "0", bg: "bg-[#CB6CE6]" }
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} p-6 border-4 border-black shadow-[8px_8px_0px_black]`}>
              <div className="text-black font-black uppercase tracking-widest text-sm mb-4 border-b-2 border-black pb-2">
                {stat.label}
              </div>
              <div className="flex items-end justify-between">
                <div className="text-5xl font-black">{stat.value}</div>
                <div className="text-xl font-bold bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_black]">{stat.change}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_black]">
          <div className="border-b-4 border-black bg-[#FFDE59] p-6 flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase">Recent Leads</h2>
            <button className="font-bold underline decoration-2 underline-offset-4 hover:bg-black hover:text-[#FFDE59] px-2 transition-colors">View All</button>
          </div>
          <div className="p-0">
            {[1,2,3,4].map((i, idx) => (
              <div key={i} className={`flex items-center justify-between p-6 ${idx !== 3 ? "border-b-4 border-black" : ""} hover:bg-gray-100 transition-colors`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">{i}</div>
                  <div>
                    <h4 className="font-black text-xl uppercase">Enterprise Deal</h4>
                    <p className="font-bold">$15,000</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="px-4 py-2 bg-[#FF914D] border-2 border-black font-black uppercase shadow-[2px_2px_0px_black]">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
