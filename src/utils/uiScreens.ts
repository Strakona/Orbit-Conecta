import { UiArtifact, UiField, UiScreen } from '../types';

export function getUiScreens(ui: UiArtifact): UiScreen[] {
  if (ui.screens && ui.screens.length > 0) {
    return ui.screens;
  }
  return [
    {
      id: 'tela-inicial',
      name: 'Início',
      title: ui.appTitle || 'Tela Inicial',
      subtitle: ui.appSubtitle || '',
      fields: ui.fields ?? [],
      infoCards: ui.infoCards ?? [],
      ctaLabel: ui.ctaLabel || 'Enviar',
    },
  ];
}

export function getAllUiFields(
  ui: UiArtifact,
): Array<UiField & { screenId: string; screenName: string }> {
  const screens = getUiScreens(ui);
  const out: Array<UiField & { screenId: string; screenName: string }> = [];
  for (const scr of screens) {
    for (const f of scr.fields) {
      out.push({
        ...f,
        screenId: scr.id,
        screenName: scr.name,
      });
    }
  }
  return out;
}

export function syncUiWithScreens(ui: UiArtifact, screens: UiScreen[]): UiArtifact {
  const first = screens[0];
  return {
    ...ui,
    screens,
    fields: first?.fields ?? [],
    infoCards: first?.infoCards ?? [],
    ctaLabel: first?.ctaLabel ?? ui.ctaLabel,
  };
}

export function createEmptyScreen(index: number): UiScreen {
  const uid = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
  return {
    id: `tela_${uid}`,
    name: `Tela ${index}`,
    title: `Nova Tela ${index}`,
    subtitle: 'Descreva o objetivo desta tela para o cidadão.',
    fields: [],
    infoCards: [],
    ctaLabel: 'Continuar',
  };
}
