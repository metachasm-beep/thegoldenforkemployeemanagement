const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

code = code.replace(
  '  sender         Employee     @relation(fields: [senderId], references: [id], onDelete: Cascade)\n}',
  '  sender         Employee     @relation(fields: [senderId], references: [id], onDelete: Cascade)\n  parentId       String?\n  parent         Message?     @relation("MessageReplies", fields: [parentId], references: [id])\n  replies        Message[]    @relation("MessageReplies")\n  reactions      Reaction[]\n}'
);

code = code.replace(
  '  messages          Message[]\n  reactions        Reaction[]',
  '  messages          Message[]'
);

code = code.replace(
  '  messages          Message[]',
  '  messages          Message[]\n  reactions         Reaction[]'
);

fs.writeFileSync('prisma/schema.prisma', code);
