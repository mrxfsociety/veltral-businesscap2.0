export const FREE_PLAYBOOK_LIMIT = 5;

export function isPro(): boolean {
  return process.env.NEXT_PUBLIC_PRO_PREVIEW === "true";
}

export function canSavePlaybook(count: number, pro = isPro()): boolean {
  return pro || count < FREE_PLAYBOOK_LIMIT;
}
