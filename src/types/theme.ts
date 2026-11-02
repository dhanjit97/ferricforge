/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppTheme =
  | 'glassmorphism'
  | 'neumorphism'
  | 'minimalism'
  | 'liquid-glass'
  | 'neo-brutalism'
  | 'material-design'
  | 'flat-design';

export type LayoutMode = 'split' | 'zen' | 'analysis';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  accentColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Translucent frosted glass with blurred backdrop and border glow',
    accentColor: '#38bdf8',
  },
  {
    id: 'neumorphism',
    name: 'Neumorphism',
    description: 'Soft extruded tactile surfaces with dual embossed shadows',
    accentColor: '#f97316',
  },
  {
    id: 'minimalism',
    name: 'Minimalism',
    description: 'Clean stark monochrome, razor-thin borders, zero clutter',
    accentColor: '#e5e5e5',
  },
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    description: 'Fluid iridescent cyan-violet refraction with deep sheen',
    accentColor: '#a855f7',
  },
  {
    id: 'neo-brutalism',
    name: 'Neo-Brutalism',
    description: 'Chunky 2px solid borders, hard 4px offset shadows, bold contrast',
    accentColor: '#facc15',
  },
  {
    id: 'material-design',
    name: 'Material Design',
    description: 'Google Material 3 layered surfaces and elevation shadows',
    accentColor: '#6366f1',
  },
  {
    id: 'flat-design',
    name: 'Flat Design',
    description: 'Pure 2D solid color blocks, zero gradients, zero shadows',
    accentColor: '#10b981',
  },
];
