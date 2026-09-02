const fs = require('fs');

let code = fs.readFileSync('src/lib/compensation.test.ts', 'utf8');

code = code.replace(/calculateMonthlyCompensation\(/g, "calculateMonthlyCompensation(45000, 15000, 5, 5000, ");
// Fix the first test expectation
code = code.replace(/expect\(result.basePayout\).toBe\(15000\);\s+expect\(result.willTerminate\).toBe\(false\);/, "expect(result.basePayout).toBe(45000);\n      expect(result.willTerminate).toBe(false);");

fs.writeFileSync('src/lib/compensation.test.ts', code);
