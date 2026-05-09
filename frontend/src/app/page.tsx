import Link from 'next/link';
import {
  CheckSquare, Users, BarChart3, ArrowRight, Zap, Shield, Globe,
  ChevronRight, Star,
} from 'lucide-react';

const features = [
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Create, assign, and track tasks across your entire team with full priority and deadline control.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Role-based access ensures managers and employees each see exactly what they need.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Metrics',
    description: 'CloudWatch-powered dashboards give you live insight into team velocity and overdue work.',
  },
  {
    icon: Zap,
    title: 'Instant Notifications',
    description: 'SNS-driven alerts keep everyone in sync the moment a task is assigned or updated.',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description: 'AWS Cognito JWT authentication with server-side team isolation on every request.',
  },
  {
    icon: Globe,
    title: 'Kanban Boards',
    description: 'Drag-and-drop cards across To Do, In Progress, In Review, and Done columns.',
  },
];

const stats = [
  { value: '10×', label: 'Faster delivery' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '< 50ms', label: 'API latency' },
  { value: '∞', label: 'Team scale' },
];

const testimonials = [
  {
    quote: 'Mini Jira cut our sprint planning from 2 hours to 20 minutes. The Kanban board is buttery smooth.',
    name: 'Sara Ahmed',
    role: 'Frontend Lead',
    initials: 'SA',
  },
  {
    quote: 'Finally a tool where my team only sees their tasks. The team isolation feature is a game-changer.',
    name: 'Omar Hassan',
    role: 'Backend Engineer',
    initials: 'OH',
  },
  {
    quote: 'The CloudWatch integration means I always know how the team is performing without asking anyone.',
    name: 'Ali Karim',
    role: 'Engineering Manager',
    initials: 'AK',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-xs font-bold text-black">MJ</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Mini Jira</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-white transition-colors">Stats</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-all"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 rounded-full px-4 py-1.5 text-sm text-white/70 mb-8">
            <Star className="w-3.5 h-3.5 text-white" />
            Built on AWS · Cognito · DynamoDB · S3
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-none mb-6">
            Project management
            <br />
            <span className="text-white/40">done right.</span>
          </h1>

          <p className="text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            A blazing-fast task management platform for engineering teams. Assign work,
            track progress, and ship faster — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-white text-black font-semibold px-7 py-3.5 rounded-xl hover:bg-white/90 transition-all text-sm"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-7 py-3.5 rounded-xl transition-all text-sm"
            >
              Sign in to workspace
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hero image — Kanban mockup */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none" />
          <div className="border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="flex-1 mx-4 h-6 rounded bg-white/10 max-w-xs" />
            </div>
            {/* Fake Kanban board */}
            <div className="p-6 flex gap-4 overflow-hidden" style={{ minHeight: 280 }}>
              {['To Do', 'In Progress', 'In Review', 'Done'].map((col, ci) => (
                <div key={col} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${['bg-white/30','bg-white/60','bg-white/80','bg-white'].at(ci)}`} />
                    <span className="text-xs font-medium text-white/60">{col}</span>
                    <span className="ml-auto text-xs text-white/30">{[3,2,1,2].at(ci)}</span>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: [3,2,1,2][ci] }).map((_, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className={`h-2 rounded bg-white/${[20,15,10,25][i % 4]} mb-2`} style={{ width: `${[80,65,90,70][i % 4]}%` }} />
                        <div className="h-1.5 rounded bg-white/10 w-1/2" />
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="w-4 h-4 rounded-full bg-white/20" />
                          <div className="h-1.5 rounded bg-white/10 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 px-6 border-y border-white/10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-sm text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Everything your team needs</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              From task creation to completion — every workflow is covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-black p-8 hover:bg-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow visual */}
      <section className="py-24 px-6 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-6">
                Built for how
                <br />teams actually work.
              </h2>
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Manager creates tasks', desc: 'Assign work to the right person on the right team with priority and deadline.' },
                  { step: '02', title: 'Team gets notified', desc: 'Instant SNS email notification fires the moment a task is assigned.' },
                  { step: '03', title: 'Progress on Kanban', desc: 'Drag cards across columns. Status syncs to the backend in real time.' },
                  { step: '04', title: 'Metrics auto-update', desc: 'CloudWatch dashboards reflect every status change, no manual reporting.' },
                ].map(item => (
                  <div key={item.step} className="flex gap-4">
                    <span className="text-xs font-mono text-white/20 mt-1 flex-shrink-0">{item.step}</span>
                    <div>
                      <p className="font-medium text-white text-sm mb-0.5">{item.title}</p>
                      <p className="text-sm text-white/40">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Task card mock */}
            <div className="relative">
              <div className="absolute -inset-4 bg-white/5 rounded-3xl blur-xl" />
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-white/10 text-white/60 rounded-full px-3 py-1">In Progress</span>
                  <span className="text-xs bg-white/10 text-white/60 rounded-full px-3 py-1">High</span>
                </div>
                <h3 className="font-semibold text-white">Redesign onboarding flow</h3>
                <p className="text-sm text-white/40">Update the user onboarding screens to match the new brand guidelines and improve conversion.</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-[10px] font-medium">SA</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Sara Ahmed</p>
                    <p className="text-[11px] text-white/40">Due May 20, 2026</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {['#fff3','#fff2','#fff1'].map((c,i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-white/20 bg-white/10" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight text-center mb-16">Loved by teams</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="border border-white/10 rounded-2xl p-6 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-white fill-white" />
                  ))}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative border border-white/10 rounded-3xl p-12 bg-white/[0.03] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to ship faster?</h2>
              <p className="text-white/40 mb-8">Join your team on Mini Jira and start managing work the right way.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 bg-white text-black font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all text-sm"
                >
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-8 py-3.5 rounded-xl transition-all text-sm"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
              <span className="text-[10px] font-bold text-black">MJ</span>
            </div>
            <span className="text-sm text-white/40">Mini Jira</span>
          </div>
          <p className="text-xs text-white/20">Built with NestJS · Next.js · AWS</p>
        </div>
      </footer>
    </div>
  );
}
