import os
import re

code = open('src/app/actions.ts', 'r').read()

def extract_function(name):
    # Find the start
    pattern = r"(?:export\s+)?async\s+function\s+" + name + r"\s*\("
    match = re.search(pattern, code)
    if not match:
        return ""
    start_idx = match.start()
    
    # Find the opening brace
    brace_idx = code.find("{", start_idx)
    if brace_idx == -1: return ""
    
    # Find matching closing brace
    count = 1
    i = brace_idx + 1
    while count > 0 and i < len(code):
        if code[i] == '{': count += 1
        elif code[i] == '}': count -= 1
        i += 1
    
    func_code = code[start_idx:i]
    if not func_code.startswith("export "):
        func_code = "export " + func_code
    return func_code

helpers = ['getSessionUser', 'requireManager', 'requireManagerOrHR', 'logAction', 'createNotification', 'markNotificationRead', 'getMyNotifications']
employeeFuncs = ['addEmployee', 'offboardEmployee', 'approveOffboardRequest', 'rejectOffboardRequest', 'forceLogoutEmployee', 'uploadAvatar', 'updateProfile', 'updateEmployee']
leadFuncs = ['addLead', 'updateLead', 'bulkReassignLeads', 'updateLeadStatusWithReason', 'deleteLead']
financeFuncs = ['addExpense', 'updateExpenseStatus', 'addPTO', 'updatePTOStatus']
settingFuncs = ['updateSystemSetting', 'triggerExportAudit']

header = """'use server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
"""

def make_file(funcs, extra_imports=""):
    content = header + extra_imports + "\n"
    for f in funcs:
        content += extract_function(f) + "\n\n"
    return content

open('src/services/core.ts', 'w').write(make_file(helpers))
open('src/services/employeeService.ts', 'w').write(make_file(employeeFuncs, "import { getSessionUser, requireManagerOrHR, logAction, createNotification, requireManager } from './core';"))
open('src/services/leadService.ts', 'w').write(make_file(leadFuncs, "import { getSessionUser, logAction, createNotification } from './core';"))
open('src/services/financeService.ts', 'w').write(make_file(financeFuncs, "import { requireManagerOrHR, logAction, createNotification } from './core';"))
open('src/services/settingService.ts', 'w').write(make_file(settingFuncs, "import { requireManager, logAction } from './core';"))

