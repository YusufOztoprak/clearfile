import Link from "next/link";
import {
 ArrowRight,
 BellRing,
 BriefcaseBusiness,
 Building2,
 CheckCircle2,
 Clock3,
 FileText,
 Layers3,
 ShieldCheck,
 Sparkles,
 Upload,
 Workflow,
} from "lucide-react";

const steps = [
 {
   title: "Submit a document",
   description: "Upload supplier files into a structured intake flow designed for operational teams.",
   icon: Upload,
 },
 {
   title: "Review with context",
   description: "Capture the details that matter, then focus human review where attention is actually needed.",
   icon: FileText,
 },
 {
   title: "Approve and archive",
   description: "Keep the approval trail clear, secure, and ready for future checks or audits.",
   icon: ShieldCheck,
 },
];

const benefits = [
 {
   value: "Clear ownership",
   label: "Every document moves through a defined path with visible responsibility.",
   icon: BriefcaseBusiness,
 },
 {
   value: "Less manual effort",
   label: "Teams spend less time chasing updates and more time on meaningful exceptions.",
   icon: Workflow,
 },
 {
   value: "Audit confidence",
   label: "A complete activity trail keeps decisions traceable and easier to verify.",
   icon: ShieldCheck,
 },
];

const features = [
 {
   title: "Document intake",
   description: "Capture incoming files with a controlled flow that fits how finance and operations teams already work.",
   icon: Sparkles,
 },
 {
   title: "Validation workflow",
   description: "Keep the review stage focused on key fields, missing information, and exception handling.",
   icon: CheckCircle2,
 },
 {
   title: "Archive and traceability",
   description: "Store approved records in a way that is easy to revisit, share, and defend when needed.",
   icon: Layers3,
 },
];

const trustBadges = ["Finance", "Accounts Payable", "Operations", "Procurement", "Compliance"];

const workflowItems = [
 "Supplier invoice received",
 "Validation in progress",
 "Approval confirmed",
 "Record archived",
];

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
     <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">{eyebrow}</p>
     <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
   </div>
 );
}

export default function HomePage() {
 return (
   <div className="space-y-24 pb-20 pt-6 text-slate-100">
     <section className="premium-panel relative overflow-hidden rounded-[32px] p-6 sm:p-8 lg:p-10">
       <div className="soft-grid absolute inset-0 opacity-35" />

       <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
         <div>
           <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-slate-200">
             <Sparkles className="h-4 w-4 text-teal-300" />
             Built for finance operations
           </div>

           <h1 className="mt-6 max-w-xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
             A calmer way to manage supplier documents.
           </h1>

           <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
             ClearFile helps teams collect, review, and close supplier documents with more consistency and less operational friction.
           </p>

           <div className="mt-8 flex flex-col gap-4 sm:flex-row">
             <Link
               href="/upload"
               className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-[0_12px_40px_rgba(34,211,238,0.35)] transition duration-200 hover:-translate-y-0.5"
             >
               Upload a document
               <ArrowRight className="h-4 w-4" />
             </Link>
             <Link
               href="/dashboard"
               className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition duration-200 hover:border-white/20 hover:bg-white/10"
             >
               Explore the dashboard
             </Link>
           </div>

           <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-slate-300">
             {[
               "Clear intake",
               "Stronger controls",
               "Human review where it matters",
             ].map((item) => (
               <div key={item} className="flex items-center gap-2">
                 <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                 {item}
               </div>
             ))}
           </div>
         </div>

           <div className="relative">
           <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.4)]">
             <div className="rounded-[22px] border border-white/10 bg-slate-900 p-4">
               <div className="flex items-center justify-between border-b border-white/10 pb-3">
                 <div>
                   <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Invoice</p>
                   <h2 className="mt-1 text-xl font-bold text-white">Supplier record</h2>
                 </div>
                 <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                   Verified
                 </span>
               </div>

               <div className="mt-4 space-y-3">
                 <div className="flex items-center justify-between rounded-2xl bg-slate-800 p-3 ring-1 ring-white/10">
                   <div>
                     <p className="text-xs text-slate-400">Vendor</p>
                     <p className="font-semibold text-white">Northwind Studio</p>
                   </div>
                   <Building2 className="h-4 w-4 text-teal-300" />
                 </div>

                 <div className="grid gap-3 sm:grid-cols-2">
                   <div className="rounded-2xl bg-slate-800 p-3 ring-1 ring-white/10">
                     <p className="text-xs text-slate-400">Due date</p>
                     <p className="mt-1 font-semibold text-white">This week</p>
                   </div>
                   <div className="rounded-2xl bg-slate-800 p-3 ring-1 ring-white/10">
                     <p className="text-xs text-slate-400">Status</p>
                     <p className="mt-1 font-semibold text-white">Ready to approve</p>
                   </div>
                 </div>

                 <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                   <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-400">
                     <span>Flow</span>
                     <span>Operations</span>
                   </div>

                   <div className="mt-4 flex items-center justify-between gap-4">
                     <div className="space-y-2">
                       {workflowItems.map((item, index) => (
                         <div key={item} className="flex items-center gap-2 text-sm text-slate-200">
                           <span
                             className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                               index === workflowItems.length - 1
                                 ? "bg-emerald-500/15 text-emerald-300"
                                 : "bg-slate-700 text-slate-200"
                             }`}
                           >
                             {index + 1}
                           </span>
                           {item}
                         </div>
                       ))}
                     </div>

                     <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-right">
                       <div className="flex items-center justify-end gap-2 text-teal-300">
                         <Clock3 className="h-4 w-4" />
                         <span className="text-[10px] uppercase tracking-[0.2em] text-slate-300">Review</span>
                       </div>
                       <p className="mt-3 text-xl font-bold text-white">On track</p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>       </div>
     </section>

     <section className="border-t border-white/10 pt-6">
       <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between">
         <p className="text-sm font-medium text-slate-400">Trusted by finance and operations teams</p>
         <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-300">
           {trustBadges.map((item) => (
             <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition duration-200 hover:border-teal-400/30 hover:text-white">
               {item}
             </span>
           ))}
         </div>
       </div>
     </section>

     <section className="grid gap-5 md:grid-cols-3">
       {benefits.map(({ value, label, icon: Icon }) => (
         <div
           key={value}
           className="group rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:border-teal-400/20 hover:bg-[#121d2c]"
         >
           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 text-teal-300 ring-1 ring-white/10">
             <Icon className="h-5 w-5" />
           </div>
           <div className="mt-5 text-2xl font-black tracking-tight text-white">{value}</div>
           <p className="mt-2 text-sm leading-6 text-slate-300">{label}</p>
         </div>
       ))}
     </section>

     <section id="process">
       <SectionHeading eyebrow="How it works" title="A straightforward process designed for real teams." />

       <div className="mt-10 grid gap-6 lg:grid-cols-3">
         {steps.map((step, index) => {
           const Icon = step.icon;

           return (
             <div
               key={step.title}
               className="rounded-[28px] border border-white/10 bg-[#111827] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.25)] transition duration-300 hover:-translate-y-1 hover:border-white/15"
             >
               <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 shadow-[0_10px_25px_rgba(34,211,238,0.25)]">
                 <Icon className="h-5 w-5" />
               </div>

               <div className="mt-6 flex items-center gap-3">
                 <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-100">
                   {index + 1}
                 </span>
                 <h3 className="text-xl font-bold text-white">{step.title}</h3>
               </div>

               <p className="mt-4 text-base leading-7 text-slate-300">{step.description}</p>
             </div>
           );
         })}
       </div>
     </section>

     <section id="solutions" className="rounded-[32px] border border-white/10 bg-[#111827] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
       <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
         <div>
           <SectionHeading eyebrow="Why teams choose it" title="Built for operational clarity, not noisy automation." align="left" />

           <ul className="mt-6 space-y-4 text-slate-300">
             {[
               "Reduce manual work across accounting and procurement without adding extra complexity",
               "Keep review focused on the records that need attention, instead of everything at once",
               "Maintain a clean approval trail that supports everyday decisions and future checks",
             ].map((item) => (
               <li key={item} className="flex items-start gap-3">
                 <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                   <CheckCircle2 className="h-4 w-4" />
                 </div>
                 <span>{item}</span>
               </li>
             ))}
           </ul>
         </div>

         <div className="grid gap-5 md:grid-cols-3">
           {features.map((feature) => {
             const Icon = feature.icon;

             return (
               <div
                 key={feature.title}
                 className="group rounded-[24px] border border-white/10 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-teal-400/20"
               >
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-teal-300 ring-1 ring-white/10 transition duration-300 group-hover:bg-teal-400/10 group-hover:text-teal-200">
                   <Icon className="h-5 w-5" />
                 </div>
                 <h3 className="mt-5 text-lg font-bold text-white">{feature.title}</h3>
                 <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
               </div>
             );
           })}
         </div>
       </div>
     </section>

     <section>
       <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-[#0f172a] via-[#101b2d] to-[#0b1320] px-6 py-10 text-white shadow-[0_35px_90px_rgba(15,23,42,0.45)] sm:px-8 lg:px-10">
         <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
           <div className="max-w-2xl">
             <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">A better daily workflow</p>
             <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
               Built to help teams move faster without losing control.
             </h2>
           </div>

           <div className="flex flex-col gap-3 sm:flex-row">
             <Link
               href="/upload"
               className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition duration-200 hover:bg-slate-100"
             >
               Get started
               <ArrowRight className="h-4 w-4" />
             </Link>
             <Link
               href="/dashboard"
               className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
             >
               Review the dashboard
               <BellRing className="h-4 w-4" />
             </Link>
           </div>
         </div>
       </div>
     </section>
   </div>
 );
}

