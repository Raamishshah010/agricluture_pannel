import React from 'react';
import { BookOpen, Mail, MessageCircle, Phone, Search, ShieldQuestion, Sparkles, Clock3, ArrowRight, FileText, Users, BadgeHelp } from 'lucide-react';

const faqs = [
  {
    question: 'How do I add a new farm?',
    answer: 'Open Manage Farms from the dashboard, then select the create action and fill in the farm details.'
  },
  {
    question: 'How do I approve an account request?',
    answer: 'Go to Account Approvals in the sidebar, review the request, and approve or reject it from the detail view.'
  },
  {
    question: 'Where can I update master data?',
    answer: 'Use the Master Data section to manage categories like crops, regions, irrigation systems, and more.'
  },
  {
    question: 'What should I do if I cannot log in?',
    answer: 'Confirm your UAE Pass session is active, then try again. If the issue continues, contact support.'
  }
];

const quickActions = [
  {
    title: 'Browse guides',
    description: 'Step-by-step help for daily dashboard tasks.',
    icon: BookOpen,
  },
  {
    title: 'System status',
    description: 'Check whether the platform or a service is experiencing issues.',
    icon: ShieldQuestion,
  },
  {
    title: 'Contact support',
    description: 'Reach the operations team when you need direct assistance.',
    icon: MessageCircle,
  },
];

const HelpCenter = () => {
  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
        <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
          <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_0.9fr] md:p-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Help Center
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
                  Find answers faster and keep your workflow moving.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                  Use this center for quick answers, support contacts, and common dashboard actions. It is built to help admins, coordinators, and field teams get unstuck quickly.
                </p>
              </div>

              <label className="flex max-w-2xl items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm transition focus-within:border-emerald-300 focus-within:bg-white">
                <Search className="h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search help articles, FAQs, or topics"
                  className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                {quickActions.map((action) => (
                  <div key={action.title} className="rounded-2xl border border-gray-100 bg-amber-50/70 p-4">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">{action.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-6 text-white shadow-lg md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <BadgeHelp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-100">Support window</p>
                  <p className="text-lg font-semibold">Sunday to Thursday</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-sm text-emerald-50">
                  <Clock3 className="h-4 w-4" />
                  Response target: within one business day
                </div>
                <div className="mt-3 space-y-2 text-sm text-emerald-50">
                  <p>Use email for detailed issues or screenshots.</p>
                  <p>Use phone for urgent platform access problems.</p>
                </div>
              </div>

              <div className="space-y-3">
                <a href="mailto:support@smart-agriculture.local" className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5">
                  <span className="flex items-center gap-3"><Mail className="h-4 w-4" /> support@smart-agriculture.local</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="tel:+971000000000" className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5">
                  <span className="flex items-center gap-3"><Phone className="h-4 w-4" /> +971 00 000 0000</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Popular questions</h2>
                <p className="text-sm text-gray-500">Common issues solved by the support team.</p>
              </div>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 open:bg-white open:shadow-sm">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">
                    <span className="flex items-center justify-between gap-3">
                      {faq.question}
                      <span className="text-lg text-emerald-600 transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Need direct help?</h2>
                <p className="text-sm text-gray-500">These options route you to the right channel.</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="rounded-2xl bg-amber-50 p-4">
                For urgent account access issues, call the support line first.
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                For non-urgent questions, email support with screenshots and a short description.
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                When reporting bugs, include the page name, steps to reproduce, and any error message.
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;