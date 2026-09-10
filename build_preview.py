
import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Previews</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;700&display=swap");
    body { font-family: "Inter", sans-serif; margin: 0; padding: 0; }
    .font-space { font-family: "Space Grotesk", sans-serif; }
    .tab-content { display: none; height: 100%; width: 100%; }
    .tab-content.active { display: block; }
    .preview-container { height: calc(100vh - 60px); overflow-y: auto; }
  </style>
  <script>
    function switchTab(id) {
      document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
      document.querySelectorAll(".tab-btn").forEach(el => {
        el.classList.remove("border-blue-500", "text-blue-600");
        el.classList.add("border-transparent", "text-gray-500");
      });
      
      document.getElementById(id).classList.add("active");
      const btn = document.getElementById("btn-" + id);
      btn.classList.remove("border-transparent", "text-gray-500");
      btn.classList.add("border-blue-500", "text-blue-600");
    }
  </script>
</head>
<body class="h-screen flex flex-col bg-gray-100">
  
  <div class="h-[60px] bg-white border-b border-gray-200 flex items-center px-4 overflow-x-auto shrink-0">
    <div class="flex space-x-8">
      <button id="btn-linear" onclick="switchTab('linear')" class="tab-btn border-b-2 border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 text-sm font-medium transition-colors">1. Linear-Style</button>
      <button id="btn-soft" onclick="switchTab('soft')" class="tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium transition-colors">2. Soft & Comforting</button>
      <button id="btn-enterprise" onclick="switchTab('enterprise')" class="tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium transition-colors">3. Enterprise Authority</button>
      <button id="btn-brutalist" onclick="switchTab('brutalist')" class="tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium transition-colors">4. Neo-Brutalist</button>
      <button id="btn-spatial" onclick="switchTab('spatial')" class="tab-btn border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium transition-colors">5. Premium Spatial</button>
    </div>
  </div>

  <div class="flex-1 overflow-hidden">
    <!-- OPTION 1: LINEAR -->
    <div id="linear" class="tab-content active bg-[#FBFBFB] text-[#111110]">
      <div class="preview-container">
        <header class="h-12 border-b border-zinc-200 bg-white flex items-center px-4 justify-between sticky top-0 z-10">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-zinc-900 rounded-sm"></div>
              <span class="font-medium text-sm">Golden Fork</span>
              <span class="text-zinc-300">/</span>
              <span class="text-sm text-zinc-600">Overview</span>
            </div>
          </div>
          <button class="text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-[4px] hover:bg-zinc-800 transition-colors">New Lead</button>
        </header>
        
        <main class="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Stat -->
            <div class="bg-white border border-zinc-200 p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div class="flex justify-between items-start mb-4">
                <span class="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Pipeline</span>
                <span class="text-zinc-400">🎯</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-semibold tracking-tight">$450k</span>
                <span class="text-xs text-emerald-600">+12%</span>
              </div>
            </div>
            <!-- Stat -->
            <div class="bg-white border border-zinc-200 p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div class="flex justify-between items-start mb-4">
                <span class="text-xs font-medium text-zinc-500 uppercase tracking-wider">Conversion Rate</span>
                <span class="text-zinc-400">📈</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-semibold tracking-tight">24.5%</span>
                <span class="text-xs text-emerald-600">+2.1%</span>
              </div>
            </div>
            <!-- Stat -->
            <div class="bg-white border border-zinc-200 p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div class="flex justify-between items-start mb-4">
                <span class="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Reps</span>
                <span class="text-zinc-400">👥</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-semibold tracking-tight">12</span>
                <span class="text-xs text-zinc-500">0</span>
              </div>
            </div>
          </div>

          <div class="border border-zinc-200 bg-white rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div class="border-b border-zinc-200 bg-zinc-50/50 px-4 py-3 flex justify-between items-center">
              <h2 class="text-sm font-medium">Recent Leads</h2>
              <button class="text-xs text-zinc-500 hover:text-zinc-900">View all</button>
            </div>
            <table class="w-full text-sm text-left">
              <thead class="bg-white border-b border-zinc-100 text-zinc-500">
                <tr>
                  <th class="px-4 py-2 font-medium">Name</th>
                  <th class="px-4 py-2 font-medium">Status</th>
                  <th class="px-4 py-2 font-medium">Value</th>
                  <th class="px-4 py-2 font-medium">Rep</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                <tr class="hover:bg-zinc-50/50 transition-colors">
                  <td class="px-4 py-3 font-medium text-zinc-900">Enterprise Deal #1</td>
                  <td class="px-4 py-3"><span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span class="text-zinc-600">Pending</span></span></td>
                  <td class="px-4 py-3 text-zinc-600">$15,000</td>
                  <td class="px-4 py-3 text-zinc-600 flex items-center gap-2"><div class="w-5 h-5 rounded-full bg-zinc-200"></div>John Doe</td>
                </tr>
                <tr class="hover:bg-zinc-50/50 transition-colors">
                  <td class="px-4 py-3 font-medium text-zinc-900">Mid-Market Deal #2</td>
                  <td class="px-4 py-3"><span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span class="text-zinc-600">Won</span></span></td>
                  <td class="px-4 py-3 text-zinc-600">$8,500</td>
                  <td class="px-4 py-3 text-zinc-600 flex items-center gap-2"><div class="w-5 h-5 rounded-full bg-zinc-200"></div>Jane Smith</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>

    <!-- OPTION 2: SOFT -->
    <div id="soft" class="tab-content bg-stone-50 text-stone-800">
      <div class="preview-container">
        <header class="h-20 flex items-center px-8 justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-rose-400 to-orange-400 rounded-2xl shadow-sm shadow-rose-200"></div>
            <h1 class="font-bold text-xl text-stone-800">Golden Fork</h1>
          </div>
          <button class="font-bold bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-md shadow-rose-200 hover:-translate-y-0.5 transition-all">
            + New Lead
          </button>
        </header>
        <main class="max-w-6xl mx-auto p-6 md:p-8 space-y-10">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50">
              <div class="flex justify-between items-center mb-6">
                <div class="p-3 rounded-2xl bg-blue-100 text-blue-600 font-bold">🎯</div>
                <span class="text-sm font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">+12%</span>
              </div>
              <div class="space-y-1">
                <h3 class="text-stone-400 font-medium">Active Pipeline</h3>
                <div class="text-3xl font-black text-stone-800">$450k</div>
              </div>
            </div>
            <div class="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50">
              <div class="flex justify-between items-center mb-6">
                <div class="p-3 rounded-2xl bg-emerald-100 text-emerald-600 font-bold">📈</div>
                <span class="text-sm font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">+2.1%</span>
              </div>
              <div class="space-y-1">
                <h3 class="text-stone-400 font-medium">Conversion Rate</h3>
                <div class="text-3xl font-black text-stone-800">24.5%</div>
              </div>
            </div>
            <div class="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50">
              <div class="flex justify-between items-center mb-6">
                <div class="p-3 rounded-2xl bg-purple-100 text-purple-600 font-bold">👥</div>
                <span class="text-sm font-bold px-3 py-1 rounded-full bg-stone-100 text-stone-500">0</span>
              </div>
              <div class="space-y-1">
                <h3 class="text-stone-400 font-medium">Active Reps</h3>
                <div class="text-3xl font-black text-stone-800">12</div>
              </div>
            </div>
          </div>
          <div class="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-xl font-bold text-stone-800">Recent Leads</h2>
              <button class="text-sm font-bold text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors">View all</button>
            </div>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-stone-100">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-500 font-bold">#1</div>
                  <div>
                    <h4 class="font-bold text-stone-800">Enterprise Deal</h4>
                    <p class="text-sm text-stone-400">$15,000</p>
                  </div>
                </div>
                <div class="flex items-center gap-6">
                  <span class="px-4 py-1.5 bg-amber-100 text-amber-700 font-bold text-sm rounded-xl">Pending</span>
                </div>
              </div>
              <div class="flex items-center justify-between p-4 hover:bg-stone-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-stone-100">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-500 font-bold">#2</div>
                  <div>
                    <h4 class="font-bold text-stone-800">Mid-Market Deal</h4>
                    <p class="text-sm text-stone-400">$8,500</p>
                  </div>
                </div>
                <div class="flex items-center gap-6">
                  <span class="px-4 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-sm rounded-xl">Won</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- OPTION 3: ENTERPRISE -->
    <div id="enterprise" class="tab-content bg-[#F4F4F4] text-[#161616]">
      <div class="preview-container">
        <header class="h-14 bg-[#161616] text-white flex items-center px-4 justify-between">
          <div class="font-semibold tracking-wide">IBM-Style Golden Fork</div>
        </header>
        <div class="border-b border-gray-300 bg-white px-4 py-3 flex items-center justify-between">
          <h1 class="text-xl font-normal">Manager Dashboard</h1>
          <button class="bg-[#0F62FE] text-white px-4 py-2 text-sm hover:bg-[#0353E9] transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#0F62FE]">Create Lead</button>
        </div>
        <main class="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-300 bg-white">
            <div class="p-4 border-r border-gray-300">
              <div class="text-sm text-[#525252] mb-2">Active Pipeline</div>
              <div class="text-3xl font-light mb-1">$450k</div>
              <div class="text-sm text-[#24A148] flex items-center gap-1">+12%</div>
            </div>
            <div class="p-4 border-r border-gray-300">
              <div class="text-sm text-[#525252] mb-2">Conversion Rate</div>
              <div class="text-3xl font-light mb-1">24.5%</div>
              <div class="text-sm text-[#24A148] flex items-center gap-1">+2.1%</div>
            </div>
            <div class="p-4">
              <div class="text-sm text-[#525252] mb-2">Active Reps</div>
              <div class="text-3xl font-light mb-1">12</div>
              <div class="text-sm text-[#525252] flex items-center gap-1">0</div>
            </div>
          </div>
          <div class="bg-white border border-gray-300">
            <div class="border-b border-gray-300 p-4">
              <h2 class="text-lg font-normal">Recent Leads</h2>
            </div>
            <table class="w-full text-sm text-left">
              <thead class="bg-[#F4F4F4] border-b border-gray-300 text-[#161616]">
                <tr>
                  <th class="px-4 py-3 font-semibold">Name</th>
                  <th class="px-4 py-3 font-semibold">Status</th>
                  <th class="px-4 py-3 font-semibold">Value</th>
                  <th class="px-4 py-3 font-semibold">Rep</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr class="hover:bg-[#E5E5E5] transition-colors">
                  <td class="px-4 py-3 text-[#0F62FE] hover:underline cursor-pointer">Enterprise Deal #1</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-2 bg-[#F1F0EE] px-2 py-1 text-xs text-[#161616]">
                      <span class="w-2 h-2 rounded-full bg-[#F1C21B]"></span>Pending
                    </span>
                  </td>
                  <td class="px-4 py-3">$15,000</td>
                  <td class="px-4 py-3">John Doe</td>
                </tr>
                <tr class="hover:bg-[#E5E5E5] transition-colors">
                  <td class="px-4 py-3 text-[#0F62FE] hover:underline cursor-pointer">Mid-Market Deal #2</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-2 bg-[#F1F0EE] px-2 py-1 text-xs text-[#161616]">
                      <span class="w-2 h-2 rounded-full bg-[#24A148]"></span>Won
                    </span>
                  </td>
                  <td class="px-4 py-3">$8,500</td>
                  <td class="px-4 py-3">Jane Smith</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>

    <!-- OPTION 4: BRUTALIST -->
    <div id="brutalist" class="tab-content bg-[#FFF4E0] text-black font-space">
      <div class="preview-container">
        <header class="h-16 bg-[#FF5757] border-b-4 border-black flex items-center px-6 justify-between">
          <div class="font-black text-2xl uppercase tracking-tighter text-white drop-shadow-[2px_2px_0px_black]">Golden Fork</div>
          <button class="font-black uppercase bg-[#FFDE59] text-black border-2 border-black px-6 py-2 shadow-[4px_4px_0px_black] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">New Lead</button>
        </header>
        <main class="max-w-6xl mx-auto p-6 md:p-10 space-y-12">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-[#5CE1E6] p-6 border-4 border-black shadow-[8px_8px_0px_black]">
              <div class="text-black font-black uppercase tracking-widest text-sm mb-4 border-b-2 border-black pb-2">Active Pipeline</div>
              <div class="flex items-end justify-between">
                <div class="text-5xl font-black">$450k</div>
                <div class="text-xl font-bold bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_black]">+12%</div>
              </div>
            </div>
            <div class="bg-[#7ED957] p-6 border-4 border-black shadow-[8px_8px_0px_black]">
              <div class="text-black font-black uppercase tracking-widest text-sm mb-4 border-b-2 border-black pb-2">Conversion Rate</div>
              <div class="flex items-end justify-between">
                <div class="text-5xl font-black">24.5%</div>
                <div class="text-xl font-bold bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_black]">+2.1%</div>
              </div>
            </div>
            <div class="bg-[#CB6CE6] p-6 border-4 border-black shadow-[8px_8px_0px_black]">
              <div class="text-black font-black uppercase tracking-widest text-sm mb-4 border-b-2 border-black pb-2">Active Reps</div>
              <div class="flex items-end justify-between">
                <div class="text-5xl font-black">12</div>
                <div class="text-xl font-bold bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_black]">0</div>
              </div>
            </div>
          </div>
          <div class="bg-white border-4 border-black shadow-[8px_8px_0px_black]">
            <div class="border-b-4 border-black bg-[#FFDE59] p-6 flex justify-between items-center">
              <h2 class="text-2xl font-black uppercase">Recent Leads</h2>
              <button class="font-bold underline decoration-2 underline-offset-4 hover:bg-black hover:text-[#FFDE59] px-2 transition-colors">View All</button>
            </div>
            <div class="p-0">
              <div class="flex items-center justify-between p-6 border-b-4 border-black hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">1</div>
                  <div>
                    <h4 class="font-black text-xl uppercase">Enterprise Deal</h4>
                    <p class="font-bold">$15,000</p>
                  </div>
                </div>
                <span class="px-4 py-2 bg-[#FF914D] border-2 border-black font-black uppercase shadow-[2px_2px_0px_black]">Pending</span>
              </div>
              <div class="flex items-center justify-between p-6 hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl">2</div>
                  <div>
                    <h4 class="font-black text-xl uppercase">Mid-Market Deal</h4>
                    <p class="font-bold">$8,500</p>
                  </div>
                </div>
                <span class="px-4 py-2 bg-[#7ED957] border-2 border-black font-black uppercase shadow-[2px_2px_0px_black]">Won</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- OPTION 5: SPATIAL -->
    <div id="spatial" class="tab-content bg-black text-white relative">
      <div class="preview-container relative z-10 overflow-hidden">
        <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none"></div>
        <div class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <header class="h-16 border-b border-white/10 bg-black/50 backdrop-blur-xl flex items-center px-8 justify-between sticky top-0 z-10">
          <div class="text-lg font-medium tracking-tight">Golden Fork</div>
          <button class="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-1.5 rounded-full text-sm font-medium transition-all backdrop-blur-md">New Lead</button>
        </header>
        <main class="max-w-6xl mx-auto p-6 md:p-10 space-y-8 relative z-10">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <div class="text-white/50 text-sm font-medium mb-3">Active Pipeline</div>
              <div class="flex items-baseline gap-3">
                <div class="text-4xl font-semibold tracking-tight">$450,000</div>
                <div class="text-sm font-medium text-emerald-400">+12%</div>
              </div>
            </div>
            <div class="bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <div class="text-white/50 text-sm font-medium mb-3">Conversion Rate</div>
              <div class="flex items-baseline gap-3">
                <div class="text-4xl font-semibold tracking-tight">24.5%</div>
                <div class="text-sm font-medium text-emerald-400">+2.1%</div>
              </div>
            </div>
            <div class="bg-white/5 border border-white/10 backdrop-blur-lg p-6 rounded-2xl hover:bg-white/10 transition-colors">
              <div class="text-white/50 text-sm font-medium mb-3">Active Reps</div>
              <div class="flex items-baseline gap-3">
                <div class="text-4xl font-semibold tracking-tight">12</div>
                <div class="text-sm font-medium text-white/30">0</div>
              </div>
            </div>
          </div>
          <div class="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
            <div class="border-b border-white/10 bg-white/5 px-6 py-4 flex justify-between items-center">
              <h2 class="text-lg font-medium">Recent Leads</h2>
              <button class="text-sm text-white/50 hover:text-white transition-colors">View All</button>
            </div>
            <table class="w-full text-sm text-left">
              <thead class="text-white/50 border-b border-white/5">
                <tr>
                  <th class="px-6 py-4 font-medium">Name</th>
                  <th class="px-6 py-4 font-medium">Status</th>
                  <th class="px-6 py-4 font-medium">Value</th>
                  <th class="px-6 py-4 font-medium">Rep</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4 font-medium">Enterprise Deal #1</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>Pending
                    </span>
                  </td>
                  <td class="px-6 py-4 text-white/70">$15,000</td>
                  <td class="px-6 py-4 text-white/70">John Doe</td>
                </tr>
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4 font-medium">Mid-Market Deal #2</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>Won
                    </span>
                  </td>
                  <td class="px-6 py-4 text-white/70">$8,500</td>
                  <td class="px-6 py-4 text-white/70">Jane Smith</td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>

  </div>
</body>
</html>
"""

with open(r"C:\Users\PAUL\.gemini\antigravity\brain\5c2ec3de-18f0-4e96-a3b1-cfbddff24d11\design_previews.html", "w", encoding="utf-8") as f:
    f.write(html_content)

