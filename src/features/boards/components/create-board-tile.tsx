import { Plus } from 'lucide-react'
import type { PropsWithChildren } from 'react'

export function CreateBoardTile({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-border/80 bg-muted/20 p-5 text-center">
      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Plus aria-hidden="true" className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium">New board</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Lists, cards, labels, teammates
        </p>
      </div>
      {children}
    </div>
  )
}
