import Link from "next/link";

export default function PreviewsIndex() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Design Overhaul Previews</h1>
        <p className="text-gray-600 mb-12">Select a design language below to view a mocked dashboard implementing its specific rules and aesthetics.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/previews/linear" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <h2 className="text-xl font-bold mb-2 text-zinc-800">1. Linear-Style</h2>
            <p className="text-sm text-gray-500">Minimalist, monochromatic, sharp, 1px borders, high data density.</p>
          </Link>
          <Link href="/previews/soft" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <h2 className="text-xl font-bold mb-2 text-rose-500">2. Soft & Comforting</h2>
            <p className="text-sm text-gray-500">Accessible, huge border radiuses, soft pastel shadows, bouncy physics.</p>
          </Link>
          <Link href="/previews/enterprise" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <h2 className="text-xl font-bold mb-2 text-blue-700">3. Enterprise Authority</h2>
            <p className="text-sm text-gray-500">IBM Carbon style, strict grids, high contrast, function over form.</p>
          </Link>
          <Link href="/previews/brutalist" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-black border-b-4 border-r-4">
            <h2 className="text-xl font-black mb-2 uppercase tracking-tight">4. Neo-Brutalist</h2>
            <p className="text-sm text-gray-700">Bold, stark shadows, heavy typography, gamified energetic vibe.</p>
          </Link>
          <Link href="/previews/spatial" className="block p-6 bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-800">
            <h2 className="text-xl font-semibold mb-2 text-white">5. Premium Spatial</h2>
            <p className="text-sm text-gray-400">Apple macOS style, glassmorphism, deep dark mode, smooth blurs.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
