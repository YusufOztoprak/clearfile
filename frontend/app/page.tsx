import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Upload,
  Workflow,
  type LucideIcon,
} from "lucide-react";

const steps = [
  {
    title: "Submit a document",
    description:
      "Upload supplier files into a structured intake flow designed for operational teams.",
    icon: Upload,
  },
  {
    title: "Review with context",
    description:
      "Capture the details that matter, then focus human review where attention is actually needed.",
    icon: FileText,
  },
  {
    title: "Approve and archive",
    description:
      "Keep the approval trail clear, secure, and ready for future checks or audits.",
    icon: ShieldCheck,
  },
];

const features = [
  {
    title: "Clear ownership",
    description:
      "Every document moves through a defined path with visible responsibility.",
    icon: Workflow,
  },
  {
    title: "Validation workflow",
    description:
      "Teams spend less time chasing updates and keep focused on the key fields, missing information, and exception handling.",
    icon: FileText,
  },
  {
    title: "Archive and traceability",
    description: "Store approved records in a way that is easy to revisit, share, and defend when needed.",
    icon: ShieldCheck,
  },
];

const workflowItems = [
  "Supplier invoice received",
  "Validation in progress",
  "Approval confirmed",
  "Record archived",
];

const trustPoints = ["Clear intake", "Stronger controls", "Human review where it matters"];

function SectionHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "default" | "muted";
}) {
  return (
    <div
      className={`rounded-xl border border-border p-5 ${
        tone === "muted" ? "bg-muted" : "bg-card"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary">
        <Icon className="h-5 w-5 text-secondary-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-14 pb-16 pt-4 text-foreground">
      {/* Hero */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">

            <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              ClearFile keeps supplier documents moving without friction.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-7 text-muted-foreground">
              A simpler way to capture, review, and close supplier files with clearer ownership and
              less operational drag.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Upload a document
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Explore dashboard
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              {trustPoints.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

            {/* Process */}
      <section id="process">
        <SectionHeading eyebrow="How it works" title="A straightforward process designed for real teams." />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary">
                <step.icon className="h-5 w-5 text-secondary-foreground gap-3" />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="mt-4 text-base leading-7 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="rounded-2xl border border-border bg-card p-5 sm:p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Why teams choose it"
              title="Built for operational clarity, not noisy automation."
              align="left"
            />
            <ul className="mt-6 space-y-4 text-muted-foreground">
              {[
                "Reduce manual work across accounting and procurement without adding complexity",
                "Keep review focused on the records that need attention instead of everything at once",
                "Maintain a clean approval trail that supports daily decisions and future checks",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:col-span-7">
            {features.map((feature) => (
              <InfoCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                tone="muted"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-2xl border border-border bg-muted p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              A better daily workflow
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built to help teams move faster without losing control.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Review dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}