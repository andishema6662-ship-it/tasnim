import type { NewsroomData, PayrollApproval, User } from "./types";
import { monthlyPayrollForAuthor } from "./payroll-calc";
export function payrollApprovalKey(userId: string, year: number, month: number): string {
  return `${userId}:${year}-${month}`;
}

export function findPayrollApproval(data: NewsroomData, userId: string, year: number, month: number): PayrollApproval | undefined {
  const key = payrollApprovalKey(userId, year, month);
  return data.payrollApprovals?.find((item) => item.id === key);
}

export function isPayrollApprovedForReporter(data: NewsroomData, user: User, year: number, month: number): boolean {
  const approval = findPayrollApproval(data, user.id, year, month);
  return approval?.status === "approved";
}

export function upsertPayrollApproval(
  data: NewsroomData,
  userId: string,
  year: number,
  month: number,
  status: PayrollApproval["status"],
  approvedByUserId?: string,
): PayrollApproval[] {
  const id = payrollApprovalKey(userId, year, month);
  const ts = new Date().toISOString();
  const next: PayrollApproval = {
    id,
    userId,
    year,
    month,
    status,
    approvedAt: status === "approved" ? ts : undefined,
    approvedByUserId: status === "approved" ? approvedByUserId : undefined,
  };
  const rest = (data.payrollApprovals ?? []).filter((item) => item.id !== id);
  return [...rest, next];
}

export function seedPendingApprovals(data: NewsroomData): PayrollApproval[] {
  const reporters = data.users.filter((user) => data.roles.find((role) => role.id === user.roleId)?.base === "reporter");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return reporters.map((user) => {
    const payroll = monthlyPayrollForAuthor(data, user.name, year, month);
    const status = payroll.lines.length >= 2 ? "approved" : "pending";
    return {
      id: payrollApprovalKey(user.id, year, month),
      userId: user.id,
      year,
      month,
      status,
      approvedAt: status === "approved" ? now.toISOString() : undefined,
      approvedByUserId: status === "approved" ? data.users.find((u) => data.roles.find((r) => r.id === u.roleId)?.base === "chief")?.id : undefined,
    };
  });
}
