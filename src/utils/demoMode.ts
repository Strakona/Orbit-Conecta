export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === '1';
}

export const STAFF_PASSCODES: Record<'PROFESSOR' | 'COORDENADOR', string> = {
  PROFESSOR:
    (import.meta.env.VITE_PROFESSOR_PIN as string | undefined)?.trim() || 'CEMI2026',
  COORDENADOR:
    (import.meta.env.VITE_COORDINATOR_PIN as string | undefined)?.trim() || 'SMED2026',
};
