import os

with open('src/components/chat/ChatWindow.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

old1 = """<div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            <AnimatePresence initial={false}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const msg = filteredMessages[virtualRow.index];
                if (!msg) return null;
                const isMe = msg.senderId === currentEmployeeId;
                const showAvatar = virtualRow.index === 0 || filteredMessages[virtualRow.index - 1]?.senderId !== msg.senderId;"""

new1 = """<div className="flex flex-col w-full relative gap-6">
            <AnimatePresence initial={false}>
              {filteredMessages.map((msg, index) => {
                if (!msg) return null;
                const isMe = msg.senderId === currentEmployeeId;
                const showAvatar = index === 0 || filteredMessages[index - 1]?.senderId !== msg.senderId;"""

code = code.replace(old1, new1)

old2 = """                return (
                  <motion.div
                    key={msg.id}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`
                    }}
                    className={`flex gap-3 group pb-6 ${isMe ? 'justify-end' : ''}`}
                  >"""

new2 = """                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 group ${isMe ? 'justify-end' : ''}`}
                  >"""

code = code.replace(old2, new2)

with open('src/components/chat/ChatWindow.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Patched ChatWindow.tsx successfully')
