import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  MessageSquare,
  Paperclip,
  Plus,
  Star,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section className="min-h-[calc(100svh-3.5rem)] py-8 md:py-14">
      <div className="grid min-h-[calc(100svh-8rem)] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex max-w-2xl flex-col gap-7">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <LayoutDashboard aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              FlowBoard
            </span>
          </div>

          <div className="flex flex-col gap-5">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              Organize your work with simple visual boards
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground text-balance md:text-lg">
              Plan projects, track tasks, and keep team collaboration clear in a
              focused workspace built around boards, lists, and cards.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-sm">
              <Link to="/register">
                Get started
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">View dashboard</Link>
            </Button>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {['Real workspaces', 'Fast boards', 'Focused cards'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-muted" />
          <Card className="relative overflow-hidden rounded-2xl border bg-background shadow-2xl shadow-foreground/10">
            <CardHeader className="border-b bg-muted/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Product launch</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Workspace board
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Star aria-hidden="true" />
                    Favorite
                  </Badge>
                  <Button size="sm">
                    <Plus data-icon="inline-start" />
                    Add card
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-4">
              <div className="grid min-w-[46rem] grid-cols-3 gap-3">
                {previewLists.map((list) => (
                  <div
                    key={list.title}
                    className="flex min-h-80 flex-col gap-3 rounded-xl bg-muted/60 p-3 ring-1 ring-border"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold">{list.title}</h2>
                      <Badge variant="outline">{list.cards.length}</Badge>
                    </div>
                    {list.cards.map((card) => (
                      <article
                        key={card.title}
                        className="rounded-lg bg-card p-3 shadow-sm ring-1 ring-border"
                      >
                        <div className="flex items-center gap-1">
                          {card.labels.map((label) => (
                            <span
                              key={label}
                              className="h-1.5 w-10 rounded-full bg-primary/70"
                            />
                          ))}
                        </div>
                        <h3 className="mt-3 text-sm font-medium leading-snug">
                          {card.title}
                        </h3>
                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <MessageSquare
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              {card.comments}
                            </span>
                            <span className="flex items-center gap-1">
                              <Paperclip
                                aria-hidden="true"
                                className="size-3.5"
                              />
                              {card.files}
                            </span>
                          </div>
                          <Avatar size="sm">
                            <AvatarFallback>{card.member}</AvatarFallback>
                          </Avatar>
                        </div>
                      </article>
                    ))}
                    <Button variant="ghost" className="justify-start">
                      <Circle data-icon="inline-start" />
                      Add card
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

const previewLists = [
  {
    title: 'Backlog',
    cards: [
      {
        title: 'Collect launch checklist',
        labels: ['Ops'],
        comments: 3,
        files: 1,
        member: 'AK',
      },
      {
        title: 'Draft workspace invite flow',
        labels: ['UX'],
        comments: 1,
        files: 0,
        member: 'MJ',
      },
    ],
  },
  {
    title: 'In progress',
    cards: [
      {
        title: 'Prepare dashboard board filters',
        labels: ['UI'],
        comments: 5,
        files: 2,
        member: 'FL',
      },
      {
        title: 'Review card movement states',
        labels: ['QA'],
        comments: 2,
        files: 1,
        member: 'NS',
      },
    ],
  },
  {
    title: 'Done',
    cards: [
      {
        title: 'Set up team workspace',
        labels: ['Core'],
        comments: 4,
        files: 3,
        member: 'FB',
      },
    ],
  },
]
