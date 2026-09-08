import os

with open("src/app/chat/ChatClientCorporate.tsx", "r", encoding="utf-8") as f:
    base = f.read()

def generate(name, replacements):
    content = base.replace("export default function ChatClient", f"export default function ChatClient{name}")
    for old, new in replacements:
        content = content.replace(old, new)
    with open(f"src/app/chat/ChatClient{name}.tsx", "w", encoding="utf-8") as f:
        f.write(content)

# 1. MINIMALIST
minimalist_replacements = [
    ('bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm', 'bg-[#FBFBFA] text-[#111] border border-[#EAEAEA] overflow-hidden font-sans'),
    ('bg-gray-50/50 dark:bg-gray-900/50', 'bg-[#FBFBFA] border-r border-[#EAEAEA]'),
    ('border-gray-100 dark:border-gray-800', 'border-[#EAEAEA]'),
    ('h-16 border-b border-gray-100 dark:border-gray-800 flex items-center px-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-20 shrink-0', 'h-16 border-b border-[#EAEAEA] flex items-center px-6 bg-[#FFFFFF] sticky top-0 z-20 shrink-0'),
    ('bg-amber-50 dark:bg-amber-900/20', 'bg-[#F9F9F8]'),
    ('font-bold uppercase text-gray-400', 'font-medium uppercase text-[#787774] tracking-[0.05em] text-[10px]'),
    ('focus:ring-amber-500', 'focus:ring-[#111]'),
    ('bg-amber-600', 'bg-[#111] text-[#FFF] rounded-[4px]'),
    ('hover:bg-amber-700', 'hover:bg-[#333] transform hover:scale-[0.98] transition-transform'),
    ('px-4 py-2.5 rounded-2xl', 'px-0 py-2 rounded-none'),
    ('bg-amber-600 text-white rounded-br-none prose-p:text-white prose-a:text-white', 'bg-transparent text-[#111] border-l border-[#111] pl-4 prose-p:text-[#111] prose-a:text-[#111]'),
    ('bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none', 'bg-transparent text-[#2F3437] border-l border-[#EAEAEA] pl-4'),
    ('rounded-xl', 'rounded-[6px]'),
    ('rounded-2xl', 'rounded-[8px]'),
    ('bg-white dark:bg-gray-900 relative', 'bg-[#FFFFFF] relative'),
    ('bg-gray-50 dark:bg-gray-800', 'bg-[#F9F9F8] border border-[#EAEAEA]'),
    ('text-gray-900 dark:text-gray-100', 'text-[#111]'),
    ('text-gray-500', 'text-[#787774]'),
    ('text-gray-400', 'text-[#999]'),
]
generate("Minimalist", minimalist_replacements)

# 2. BRUTALIST
brutalist_replacements = [
    ('bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm', 'bg-white border-4 border-black font-mono shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] uppercase overflow-hidden'),
    ('bg-gray-50/50 dark:bg-gray-900/50', 'bg-[#ffeb3b] border-r-4 border-black'),
    ('border-gray-100 dark:border-gray-800', 'border-black border-b-4'),
    ('h-16 border-b border-gray-100 dark:border-gray-800 flex items-center px-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-20 shrink-0', 'h-16 border-b-4 border-black flex items-center px-6 bg-[#ffeb3b] sticky top-0 z-20 shrink-0 font-black'),
    ('rounded-xl', 'rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'),
    ('rounded-2xl', 'rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'),
    ('focus:ring-amber-500', 'focus:ring-0 focus:bg-[#ffeb3b]'),
    ('bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-6 rounded-xl font-medium transition-colors', 'bg-[#ff3b30] hover:bg-red-500 disabled:opacity-50 text-black px-6 font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-none rounded-none'),
    ('px-4 py-2.5 rounded-2xl prose prose-sm dark:prose-invert break-words max-w-full', 'p-4 border-2 border-black prose prose-sm font-black break-words max-w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'),
    ('bg-amber-600 text-white rounded-br-none prose-p:text-white prose-a:text-white', 'bg-black text-white rounded-none prose-p:text-white prose-a:text-[#ffeb3b]'),
    ('bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none', 'bg-white text-black rounded-none'),
    ('bg-amber-50 dark:bg-amber-900/20', 'bg-[#ff3b30] text-black border-y-4 border-black font-black'),
    ('bg-white dark:bg-gray-900 relative', 'bg-white relative'),
    ('bg-gray-50 dark:bg-gray-800', 'bg-gray-100 border-2 border-black'),
    ('text-gray-500', 'text-black font-bold'),
    ('text-gray-400', 'text-black font-bold uppercase underline'),
]
generate("Brutalist", brutalist_replacements)

# 3. SOFT GLASSMORPHISM
soft_replacements = [
    ('bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm', 'bg-white/40 dark:bg-gray-900/40 rounded-[2.5rem] border border-white/50 dark:border-gray-700/50 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl'),
    ('bg-gray-50/50 dark:bg-gray-900/50', 'bg-white/20 dark:bg-gray-900/20 backdrop-blur-md'),
    ('border-gray-100 dark:border-gray-800', 'border-white/40 dark:border-gray-700/40'),
    ('rounded-xl', 'rounded-full'),
    ('rounded-2xl', 'rounded-[1.5rem]'),
    ('bg-amber-600 hover:bg-amber-700', 'bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-200 dark:shadow-none transition-all'),
    ('focus:ring-amber-500', 'focus:ring-purple-400 focus:ring-offset-2'),
    ('bg-amber-50 dark:bg-amber-900/20', 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-inner'),
    ('bg-amber-600 text-white rounded-br-none prose-p:text-white prose-a:text-white', 'bg-gradient-to-br from-pink-400 to-purple-500 text-white rounded-br-md prose-p:text-white prose-a:text-pink-100 shadow-md shadow-pink-200 dark:shadow-none'),
    ('bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none', 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-md text-gray-900 dark:text-gray-100 rounded-bl-md border border-white/50 dark:border-gray-700/50 shadow-sm'),
]
generate("Soft", soft_replacements)

# 4. TERMINAL HACKER
hacker_replacements = [
    ('bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm', 'bg-black text-[#00ff00] border border-[#00ff00] font-mono rounded-none overflow-hidden'),
    ('bg-gray-50/50 dark:bg-gray-900/50', 'bg-black border-r border-[#00ff00]'),
    ('border-gray-100 dark:border-gray-800', 'border-[#00ff00]'),
    ('bg-white dark:bg-gray-900 relative', 'bg-black relative'),
    ('bg-white dark:bg-gray-800', 'bg-black border border-[#00ff00] text-[#00ff00]'),
    ('bg-gray-50 dark:bg-gray-800', 'bg-black text-[#00ff00]'),
    ('text-gray-900 dark:text-gray-100', 'text-[#00ff00]'),
    ('text-gray-500', 'text-[#00cc00]'),
    ('text-gray-400', 'text-[#00aa00] text-xs'),
    ('bg-amber-50 dark:bg-amber-900/20', 'bg-[#003300] text-[#00ff00] border-y border-[#00ff00]'),
    ('rounded-xl', 'rounded-none'),
    ('rounded-2xl', 'rounded-none'),
    ('focus:ring-amber-500', 'focus:ring-[#00ff00] bg-black'),
    ('bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-6 rounded-xl font-medium transition-colors', 'bg-[#00ff00] hover:bg-[#00cc00] disabled:opacity-50 text-black border border-[#00ff00] px-6 rounded-none font-bold'),
    ('bg-amber-600 text-white rounded-br-none prose-p:text-white prose-a:text-white', 'bg-transparent text-[#00ff00] border-l-4 border-[#00ff00] pl-2'),
    ('bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none', 'bg-transparent text-[#00ff00] border-l-4 border-[#005500] pl-2'),
    ('px-4 py-2.5 rounded-2xl prose prose-sm dark:prose-invert break-words max-w-full', 'px-0 py-1 prose prose-sm prose-p:text-[#00ff00] prose-a:text-[#00ff00] break-words max-w-full'),
]
generate("Hacker", hacker_replacements)

print("Generated 4 theme variants.")
