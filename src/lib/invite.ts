export const INVITE_STORAGE_KEY = "invitation-opened";

export function inviteAlreadyOpened(): boolean {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(INVITE_STORAGE_KEY) === "1"
  );
}

export function markInviteOpened(): void {
  window.sessionStorage.setItem(INVITE_STORAGE_KEY, "1");
}
