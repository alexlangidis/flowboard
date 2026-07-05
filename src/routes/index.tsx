import { createFileRoute, Link } from '@tanstack/react-router'
import { Circle, MessageSquare } from 'lucide-react'

import { redirectAuthenticatedUser } from '@/features/auth/api/route-guards'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicNav } from '@/components/layout/public-nav'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  beforeLoad: redirectAuthenticatedUser,
  component: HomePage,
})

const trustItems = ['No credit card', 'Unlimited boards', 'Team workspaces']

const workflowSteps = [
  {
    step: '01',
    title: 'Create a board',
    body: 'One place per project, launch, or workflow.',
  },
  {
    step: '02',
    title: 'Break work into cards',
    body: 'Assign owners, add labels, attach context.',
  },
  {
    step: '03',
    title: 'Move work forward',
    body: 'Drag cards across lists as status changes.',
  },
]

const stats = [
  { value: 'Boards', label: 'Project containers' },
  { value: 'Lists', label: 'Workflow stages' },
  { value: 'Cards', label: 'Actionable tasks' },
  { value: 'Teams', label: 'Shared workspaces', accent: true },
]

const compactFeatures = [
  {
    title: 'Labels & filters',
    body: 'Color-code work by priority, team, or type.',
    swatchClass: 'bg-flow-pink',
  },
  {
    title: 'Activity trail',
    body: 'See who moved what and when on every card.',
    swatchClass: 'bg-flow-cyan',
  },
  {
    title: 'Focused views',
    body: 'Star boards and jump back to active work instantly.',
    swatchClass: 'bg-flow-green',
  },
]

const labelSwatchClasses = [
  'bg-flow-blue',
  'bg-flow-purple',
  'bg-flow-yellow',
  'bg-flow-green',
]

const previewLists = [
  {
    title: 'Backlog',
    count: 4,
    swatchClass: 'bg-flow-blue',
    cards: [
      {
        title: 'Collect launch checklist',
        labels: ['Ops'],
        comments: 3,
        member: 'AK',
      },
      {
        title: 'Draft invite flow',
        labels: ['UX'],
        comments: 1,
        member: 'MJ',
      },
    ],
  },
  {
    title: 'In progress',
    count: 3,
    swatchClass: 'bg-flow-yellow',
    cards: [
      {
        title: 'Prepare board filters',
        labels: ['UI'],
        comments: 5,
        member: 'FL',
      },
      {
        title: 'Review drag states',
        labels: ['QA'],
        comments: 2,
        member: 'NS',
      },
    ],
  },
  {
    title: 'Done',
    count: 6,
    swatchClass: 'bg-flow-green',
    cards: [
      {
        title: 'Set up team workspace',
        labels: ['Core'],
        comments: 4,
        member: 'FB',
      },
    ],
  },
]

function HomePage() {
  return (
    <div className="w-full pb-10">
      <PublicNav />

      <HeroSection />
      <StatsStrip />
      <WorkflowStrip />
      <BentoFeatures />
      <CTABand />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="grid items-center gap-7 py-8 sm:gap-8 sm:py-10 lg:grid-cols-2 lg:gap-10 lg:py-12">
      <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
        <Badge className="w-fit border-primary/20 bg-primary/10 text-primary">
          Visual project planning
        </Badge>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.25rem] lg:leading-tight">
            See the whole board. Ship the next card.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground text-pretty sm:text-[1.05rem]">
            FlowBoard turns scattered tasks into a clear pipeline — boards for
            focus, lists for stages, cards for action. Built for teams that move
            fast without losing context.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg">
            <Link to="/register">Start free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#board-preview">View demo board</a>
          </Button>
        </div>

        <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          {trustItems.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-primary"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div id="board-preview" className="min-w-0 scroll-mt-20">
        <BoardPreview />
      </div>
    </section>
  )
}

function StatsStrip() {
  return (
    <section className="py-7 sm:py-8">
      <Separator />
      <dl className="grid grid-cols-2 gap-6 py-7 sm:grid-cols-4 sm:gap-8 sm:py-8">
        {stats.map((stat) => (
          <div key={stat.value} className="min-w-0">
            <dt
              className={cn(
                'text-xl font-semibold tracking-tight sm:text-2xl',
                stat.accent && 'text-flow-blue',
              )}
            >
              {stat.value}
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
          </div>
        ))}
      </dl>
      <Separator />
    </section>
  )
}

function WorkflowStrip() {
  return (
    <section className="py-8 sm:py-10">
      <div className="mb-6 flex flex-col gap-2 sm:mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          How work flows
        </h2>
        <p className="max-w-2xl text-muted-foreground">
          Three layers. One mental model your whole team already understands.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {workflowSteps.map((item) => (
          <article key={item.step} className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
              {item.step}
            </p>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function BentoFeatures() {
  const stages = ['Backlog', 'Doing', 'Review', 'Done']

  return (
    <section className="py-8 sm:py-10">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:mb-8">
        Everything you need, nothing you don&apos;t
      </h2>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="min-w-0">
          <CardHeader className="border-b-0">
            <CardTitle className="text-base">Drag-and-drop boards</CardTitle>
            <CardAction>
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-sm bg-flow-blue"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Move cards between lists with natural drag gestures. Reorder
              priorities in seconds, not standups.
            </p>
            <div className="flex flex-wrap gap-2">
              {stages.map((stage, index) => (
                <div
                  key={stage}
                  className={cn(
                    'min-w-[4.5rem] flex-1 rounded-md border px-2 py-2 text-center text-xs',
                    index === 1
                      ? 'border-flow-blue/35 bg-flow-blue/10 text-foreground'
                      : 'border-border/60 bg-muted/30 text-muted-foreground',
                  )}
                >
                  {stage}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <FeatureCard
            title="Team workspaces"
            description="Group boards by team or client. Invite members and keep related work in one place."
            swatchClass="bg-flow-purple"
          />
          <FeatureCard
            title="Cards with context"
            description="Descriptions, comments, labels, and attachments — each card carries the full story."
            swatchClass="bg-flow-yellow"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {compactFeatures.map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg border border-border/80 p-4 sm:p-[1.1rem]"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn('size-2 shrink-0 rounded-sm', feature.swatchClass)}
              />
              <h3 className="text-sm font-semibold">{feature.title}</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeatureCard({
  title,
  description,
  swatchClass,
}: {
  title: string
  description: string
  swatchClass: string
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="border-b-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardAction>
          <span
            aria-hidden="true"
            className={cn('size-2.5 shrink-0 rounded-sm', swatchClass)}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

function CTABand() {
  return (
    <section className="my-4 rounded-xl border border-border/80 bg-muted/30 p-5 sm:p-7">
      <div className="grid items-center gap-5 lg:grid-cols-[1fr_auto] lg:gap-8">
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-semibold tracking-tight sm:text-[1.25rem]">
            Ready to organize your next sprint?
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Create your workspace in under a minute. No setup calls, no
            migration headaches.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/register">Create free account</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function LabelBar({ labels }: { labels: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {labels.map((label, index) => (
        <span
          key={label}
          aria-hidden="true"
          className={cn(
            'h-1 w-7 rounded-full opacity-85',
            labelSwatchClasses[index % labelSwatchClasses.length],
          )}
        />
      ))}
    </div>
  )
}

function KanbanCard({
  title,
  labels,
  comments,
  member,
}: {
  title: string
  labels: string[]
  comments: number
  member: string
}) {
  return (
    <article className="rounded-lg border bg-card p-3">
      <LabelBar labels={labels} />
      <h4 className="mt-2 text-sm leading-snug font-medium">{title}</h4>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageSquare aria-hidden="true" className="size-3.5" />
          {comments} comments
        </span>
        <Avatar size="sm">
          <AvatarFallback>{member}</AvatarFallback>
        </Avatar>
      </div>
    </article>
  )
}

function BoardPreview() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-base">Product launch</CardTitle>
        <CardAction>
          <Badge className="border-primary/20 bg-primary/10 text-primary">
            Live preview
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="bg-muted/20 p-3 sm:p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Alex&apos;s Workspace
        </p>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-[32rem] gap-2.5 sm:min-w-[34rem] sm:gap-3">
            {previewLists.map((list) => (
              <div
                key={list.title}
                className="flex min-w-40 flex-1 flex-col gap-2 rounded-xl border bg-muted/50 p-2.5 sm:gap-2.5 sm:p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn('size-2 shrink-0 rounded-sm', list.swatchClass)}
                  />
                  <h3 className="text-sm font-semibold">{list.title}</h3>
                  <Badge variant="outline" className="ml-auto">
                    {list.count}
                  </Badge>
                </div>
                {list.cards.map((card) => (
                  <KanbanCard key={card.title} {...card} />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start px-2 text-muted-foreground"
                >
                  <Circle data-icon="inline-start" />
                  Add card
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
