import { cn } from '@/lib/utils'

export function WorkspaceStats({
  items,
}: {
  items: Array<{
    label: string
    value: string | number
    accent?: boolean
  }>
}) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt
            className={cn(
              'truncate text-xl font-semibold tracking-tight sm:text-2xl',
              item.accent && 'text-flow-blue',
            )}
          >
            {item.value}
          </dt>
          <dd className="mt-1 text-sm text-muted-foreground">{item.label}</dd>
        </div>
      ))}
    </dl>
  )
}
