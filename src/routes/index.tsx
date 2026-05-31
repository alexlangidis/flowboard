import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Columns3,
  LayoutDashboard,
  MessageSquare,
  Paperclip,
  Plus,
  Star,
  Users,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicNav } from '@/components/layout/public-nav'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-svh">
      <PublicNav />

      <section className="grid min-h-[calc(100svh-10rem)] items-center gap-10 py-8 lg:grid-cols-[0.88fr_1.12fr] lg:py-12">
        <div className="flex max-w-2xl flex-col gap-7">
          <Badge className="w-fit" variant="secondary">
            <CheckCircle2 aria-hidden="true" />
            Visual project planning
          </Badge>

          <div className="flex flex-col gap-5">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              Work moves faster when every task has a clear place
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground text-balance md:text-lg">
              FlowBoard keeps projects organized with boards, lists, and cards
              that are simple enough for daily work and structured enough for
              growing teams.
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
              <Link to="/login">Sign in</Link>
            </Button>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {[
              'Boards for focus',
              'Cards for action',
              'Workspaces for teams',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <BoardPreview />
      </section>

      <section className="grid gap-4 pb-10 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-background shadow-sm">
            <CardHeader>
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <feature.icon aria-hidden="true" className="size-4" />
              </span>
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}

function BoardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-muted" />
      <Card className="relative overflow-hidden border bg-background shadow-2xl shadow-foreground/10">
        <CardHeader className="border-b bg-muted/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <LayoutDashboard aria-hidden="true" className="size-4" />
                <CardTitle>Product launch</CardTitle>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Alex Lag&apos;s Workspace
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
          <div className="grid min-w-[44rem] grid-cols-3 gap-3">
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
                          <Paperclip aria-hidden="true" className="size-3.5" />
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
  )
}

const features = [
  {
    title: 'Plan with boards',
    description:
      'Create focused boards for projects, launches, support work, and recurring workflows.',
    icon: Columns3,
  },
  {
    title: 'Track every card',
    description:
      'Break work into clear cards with descriptions, status, activity, and ownership.',
    icon: CheckCircle2,
  },
  {
    title: 'Keep teams aligned',
    description:
      'Use workspaces to keep related boards organized as your work grows.',
    icon: Users,
  },
]

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
        title: 'Prepare board filters',
        labels: ['UI'],
        comments: 5,
        files: 2,
        member: 'FL',
      },
      {
        title: 'Review movement states',
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
