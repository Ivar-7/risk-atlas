const housingClasses: Record<string, string> = {
  informal_iron_sheet: 'var(--color-danger)',
  semi_permanent: '#c46d19',
  permanent_masonry: 'var(--color-steel-blue)',
  concrete_rcc: 'var(--color-success)',
}

export const chartTheme = {
  primary: 'var(--color-accent)',
  comparison: 'var(--color-steel-blue)',
  navy: 'var(--color-brand-navy)',
  grey: 'var(--color-brand-grey)',
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
  sequential: [
    'var(--color-sequential-low)',
    'var(--color-sequential-mid)',
    'var(--color-sequential-high)',
  ],
  grid: 'var(--color-border)',
  axis: 'var(--color-brand-grey)',
  axisLabel: 'var(--color-text-muted)',
  tooltip: {
    contentStyle: {
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      color: 'var(--color-text)',
      boxShadow: 'var(--shadow-dashboard)',
    },
    labelStyle: { color: 'var(--color-text)', marginBottom: 4 },
  },
  cursor: 'var(--color-surface-alt)',
  fontSize: 12,
  housingClasses,
} as const

export function housingClassColor(housingClass: string): string {
  return housingClasses[housingClass] ?? chartTheme.grey
}
