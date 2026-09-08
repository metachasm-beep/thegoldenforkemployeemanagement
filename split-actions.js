const fs = require('fs');

let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const [
  helpersBlock,
  employeeBlock,
  leadBlock,
  expensePtoBlock,
  settingsBlock
] = code.split(/\/\/\s*---------------------------------------------------------------------------\r?\n\/\/\s*(?:Employee mutations|Lead mutations|Expense & PTO mutations|Settings mutations)\r?\n\/\/\s*---------------------------------------------------------------------------\r?\n/);

fs.writeFileSync('src/services/core.ts', "'use server';\n" + helpersBlock.replace(/'use server';\s*/, ''));

const header = `'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSessionUser, requireManager, requireManagerOrHR, logAction, createNotification } from './core';\n\n`;

fs.writeFileSync('src/services/employeeService.ts', header + employeeBlock);
fs.writeFileSync('src/services/leadService.ts', header + leadBlock);
fs.writeFileSync('src/services/financeService.ts', header + expensePtoBlock);
fs.writeFileSync('src/services/settingService.ts', header + (settingsBlock || ''));

