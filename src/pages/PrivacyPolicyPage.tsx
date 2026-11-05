import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { AutoaceLogo } from '../components/AutoaceLogo';

export const PrivacyPolicyPage: React.FC = () => (
  <main className="min-h-screen bg-[#f6f7f9] px-5 py-6 text-neutral-900 sm:px-8 sm:py-10">
    <div className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between gap-4">
        <a href="/" aria-label="Autoace Zambia home"><AutoaceLogo variant="light-mode" className="h-6 w-40" style={{ width: '160px', height: '24px' }} /></a>
        <a href="/agent" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-white hover:text-neutral-950"><ArrowLeft className="size-4" />Back to registration</a>
      </header>
      <article className="mt-10 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900"><AlertTriangle className="size-4" />Draft — review before public launch</div>
        <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Privacy notice</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">This draft explains how information submitted through AutoAce agent registration is intended to be used. AutoAce must complete the contact and retention details below and review the notice before accepting applications publicly.</p>

        <div className="mt-8 space-y-7 text-sm leading-6 text-neutral-700">
          <section>
            <h2 className="text-base font-extrabold text-neutral-950">Information collected</h2>
            <p className="mt-2">The form asks for your name, WhatsApp number, city or town, province and optional email address. It also collects your professional role, experience, company or independent status, vehicle sourcing capabilities, sourcing locations, services, availability and any optional information you provide. It does not request NRC numbers or NRC documents.</p>
          </section>
          <section>
            <h2 className="text-base font-extrabold text-neutral-950">Why it is used</h2>
            <p className="mt-2">AutoAce uses these details to receive and review agent applications, contact applicants, conduct onboarding or verification, and consider potential sourcing opportunities. Applications remain pending until reviewed by the AutoAce team; submission does not automatically approve an applicant.</p>
          </section>
          <section>
            <h2 className="text-base font-extrabold text-neutral-950">Access and service providers</h2>
            <p className="mt-2">Application information is intended for access by authorised AutoAce administrators and the service providers needed to operate the website, database, administration and alerts. AutoAce should confirm which providers process these details, their processing locations and any applicable international-transfer safeguards before finalising this notice.</p>
          </section>
          <section>
            <h2 className="text-base font-extrabold text-neutral-950">Retention and your choices</h2>
            <p className="mt-2">AutoAce should set and publish a retention period for applications. You may ask to access or correct your information, request deletion or withdraw consent, subject to any lawful need to retain it. A working AutoAce privacy contact for these requests has not yet been provided and must be added before launch.</p>
          </section>
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <h2 className="text-base font-extrabold text-amber-950">Items AutoAce must complete</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-950/85">
              <li>Publish the controller's legal/business name and a privacy contact email or WhatsApp number.</li>
              <li>Set a specific application retention period and deletion process.</li>
              <li>Confirm the service providers, processing locations and any cross-border transfer safeguards.</li>
              <li>Have the final notice reviewed for the Data Protection Act No. 3 of 2021 and AutoAce's actual practices.</li>
            </ul>
          </section>
        </div>
        <p className="mt-8 border-t border-neutral-100 pt-5 text-xs leading-5 text-neutral-500">This is a working draft, not a legal opinion or a representation that AutoAce is fully compliant. Last updated 5 November 2026.</p>
      </article>
    </div>
  </main>
);
