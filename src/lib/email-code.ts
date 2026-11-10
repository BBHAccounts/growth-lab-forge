export function validEmailCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}