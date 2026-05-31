import {
  Bookmark,
  Bug,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Flag,
  Flame,
  LayoutGrid,
  PanelTop,
  Rocket,
  Square,
  Target,
} from 'lucide-react'

export type BoardTheme = {
  canvas: string
  name: string
  swatch: string
}

export type ListColor = {
  bar: string
  icon: string
  name: string
  swatch: string
}

export type ListIcon = {
  icon: typeof CircleDot
  name: string
}

export type CardColor = {
  bar: string
  mutedBar: string
  name: string
  swatch: string
}

export type ChecklistItem = {
  id: string
  completed: boolean
  text: string
}

export type CardAttachmentItem = {
  id: string
  name: string
  size: number
  contentType: string | null
  createdAt: string
}

export const boardThemes: BoardTheme[] = [
  {
    name: 'Sky',
    canvas:
      'bg-[radial-gradient(circle_at_12%_8%,_rgba(255,255,255,0.72),_transparent_28rem),radial-gradient(circle_at_82%_16%,_oklch(0.80_0.11_224_/_0.92),_transparent_30rem),linear-gradient(135deg,_oklch(0.78_0.11_222),_oklch(0.59_0.15_252))]',
    swatch: 'bg-sky-500',
  },
  {
    name: 'Aurora',
    canvas:
      'bg-[radial-gradient(circle_at_14%_10%,_oklch(0.88_0.10_330_/_0.86),_transparent_28rem),radial-gradient(circle_at_78%_18%,_oklch(0.79_0.14_178_/_0.78),_transparent_30rem),linear-gradient(135deg,_oklch(0.68_0.16_292),_oklch(0.55_0.16_240))]',
    swatch: 'bg-violet-500',
  },
  {
    name: 'Lagoon',
    canvas:
      'bg-[radial-gradient(circle_at_12%_8%,_oklch(0.90_0.08_175_/_0.82),_transparent_28rem),radial-gradient(circle_at_84%_18%,_oklch(0.72_0.13_190_/_0.78),_transparent_30rem),linear-gradient(135deg,_oklch(0.70_0.13_181),_oklch(0.50_0.12_210))]',
    swatch: 'bg-teal-500',
  },
  {
    name: 'Coral',
    canvas:
      'bg-[radial-gradient(circle_at_14%_8%,_oklch(0.91_0.10_70_/_0.86),_transparent_28rem),radial-gradient(circle_at_80%_18%,_oklch(0.77_0.15_22_/_0.75),_transparent_30rem),linear-gradient(135deg,_oklch(0.73_0.16_42),_oklch(0.57_0.16_18))]',
    swatch: 'bg-orange-500',
  },
  {
    name: 'Slate',
    canvas:
      'bg-[radial-gradient(circle_at_12%_8%,_oklch(0.80_0.05_245_/_0.56),_transparent_28rem),radial-gradient(circle_at_82%_12%,_oklch(0.62_0.10_225_/_0.62),_transparent_30rem),linear-gradient(135deg,_oklch(0.45_0.07_250),_oklch(0.33_0.05_260))]',
    swatch: 'bg-slate-600',
  },
]

export const listColors: ListColor[] = [
  {
    bar: 'bg-sky-500',
    icon: 'bg-sky-100 text-sky-700',
    name: 'Sky',
    swatch: 'bg-sky-500',
  },
  {
    bar: 'bg-violet-500',
    icon: 'bg-violet-100 text-violet-700',
    name: 'Violet',
    swatch: 'bg-violet-500',
  },
  {
    bar: 'bg-emerald-500',
    icon: 'bg-emerald-100 text-emerald-700',
    name: 'Emerald',
    swatch: 'bg-emerald-500',
  },
  {
    bar: 'bg-amber-500',
    icon: 'bg-amber-100 text-amber-700',
    name: 'Amber',
    swatch: 'bg-amber-500',
  },
  {
    bar: 'bg-rose-500',
    icon: 'bg-rose-100 text-rose-700',
    name: 'Rose',
    swatch: 'bg-rose-500',
  },
]

export const listIcons: ListIcon[] = [
  { name: 'Circle', icon: CircleDot },
  { name: 'Board', icon: LayoutGrid },
  { name: 'Panel', icon: PanelTop },
  { name: 'Done', icon: CheckCircle2 },
  { name: 'Square', icon: Square },
  { name: 'Tasks', icon: ClipboardList },
  { name: 'Flag', icon: Flag },
  { name: 'Rocket', icon: Rocket },
  { name: 'Target', icon: Target },
  { name: 'Flame', icon: Flame },
  { name: 'Bug', icon: Bug },
  { name: 'Bookmark', icon: Bookmark },
]

export const cardColors: CardColor[] = [
  {
    bar: 'bg-sky-500',
    mutedBar: 'bg-sky-200',
    name: 'Sky',
    swatch: 'bg-sky-500',
  },
  {
    bar: 'bg-violet-500',
    mutedBar: 'bg-violet-200',
    name: 'Violet',
    swatch: 'bg-violet-500',
  },
  {
    bar: 'bg-emerald-500',
    mutedBar: 'bg-emerald-200',
    name: 'Emerald',
    swatch: 'bg-emerald-500',
  },
  {
    bar: 'bg-amber-500',
    mutedBar: 'bg-amber-200',
    name: 'Amber',
    swatch: 'bg-amber-500',
  },
  {
    bar: 'bg-rose-500',
    mutedBar: 'bg-rose-200',
    name: 'Rose',
    swatch: 'bg-rose-500',
  },
]
