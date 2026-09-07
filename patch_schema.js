const fs = require('fs');
let code = fs.readFileSync('prisma/schema.prisma', 'utf8');

const newModel = `
model OffboardRequest {
  id          String   @id @default(uuid())
  employeeId  String
  requestedBy String
  status      String   @default("Pending") // Pending, Approved, Rejected
  createdAt   DateTime @default(now())
}
`;

code += newModel;
fs.writeFileSync('prisma/schema.prisma', code);
console.log("Added OffboardRequest to schema");
