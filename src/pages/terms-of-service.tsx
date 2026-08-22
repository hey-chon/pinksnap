import { Link } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Camera,
  HeartHandshake,
  Shield,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function TermsOfService() {
  const lastUpdated = 'August 2026';

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="TERMS OF SERVICE" />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-4xl w-full py-4 sm:py-8 space-y-8">
          {/* Header Banner */}
          <div className="text-center">
            <h1 className="font-display text-[2.5rem] leading-[.95] sm:text-5xl md:text-6xl text-foreground">
              TERMS OF <span className="text-primary">SERVICE</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[.15em] text-foreground/60 mt-3">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Key Principles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="ticket p-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg tracking-wide text-foreground mb-1">FREE TO USE</h2>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  PinkSnap is a fun, accessible virtual photobooth built for everyone to enjoy and create memories.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-primary mt-3 inline-block">Free & Creative</span>
            </div>

            <div className="ticket p-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Camera className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg tracking-wide text-foreground mb-1">YOUR PHOTOS</h2>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  You own all the photos you snap. We claim no intellectual property rights or ownership over your memories.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-primary mt-3 inline-block">100% User Owned</span>
            </div>

            <div className="ticket p-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg tracking-wide text-foreground mb-1">KIND COMMUNITY</h2>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  Treat everyone with kindness in chat. Harassment, hate speech, spam, and abuse are strictly prohibited.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-primary mt-3 inline-block">Safe & Respectful</span>
            </div>

            <div className="ticket p-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg tracking-wide text-foreground mb-1">AS-IS SERVICE</h2>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  PinkSnap is a student web development project provided as-is without commercial uptime warranties.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-primary mt-3 inline-block">Open Project</span>
            </div>
          </div>

          {/* Comprehensive Terms Sections */}
          <div className="space-y-6">
            {/* Section 1 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  1
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  ACCEPTANCE OF TERMS
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  By accessing or using <strong>PinkSnap</strong> (the "Service", "App", or "Website"), accessible at pink-snap.dev or through any related domains, you agree to be bound by these Terms of Service ("Terms") and our <Link href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
                </p>
                <p>
                  If you do not agree to these Terms, please do not use PinkSnap or its associated services.
                </p>
              </div>
            </article>

            {/* Section 2 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  2
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  SERVICE OVERVIEW & STUDENT PROJECT STATUS
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  PinkSnap provides an interactive digital photobooth experience allowing users to take photos via webcam, apply filters, customize frame borders and stickers, and download photo strips to their personal devices.
                </p>
                <p>
                  PinkSnap is maintained by Jimson as a passionate student web developer project. The Service is made available free of charge for personal, recreational use. Features and availability may evolve over time.
                </p>
              </div>
            </article>

            {/* Section 3 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  3
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  ACCEPTABLE USE & COMMUNITY CONDUCT
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  When using PinkSnap, including the Community Chat and photo booth features, you agree not to:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/75">
                  <li>Post, broadcast, or transmit abusive, harassing, defamatory, discriminatory, obscene, or threatening messages in the community chat.</li>
                  <li>Attempt to bypass profanity filters, spam chat rooms, or flood the application with automated scripts.</li>
                  <li>Use the photobooth to capture, generate, or distribute non-consensual imagery or illegal content.</li>
                  <li>Attempt to disrupt, compromise, reverse engineer, or maliciously probe the underlying server infrastructure, APIs, or database connections.</li>
                  <li>Impersonate another user, administrator, or creator of PinkSnap.</li>
                </ul>
              </div>
            </article>

            {/* Section 4 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  4
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  INTELLECTUAL PROPERTY & USER CONTENT
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  <strong>Your Photos:</strong> You retain complete and exclusive ownership of all photographs, poses, and custom photo strips generated while using PinkSnap. We do not claim any ownership rights over your captured media.
                </p>
                <p>
                  <strong>PinkSnap IP:</strong> The PinkSnap logo, brand names, visual styling, photobooth frame templates, interface layouts, and source code are the intellectual property of Jimson / PinkSnap.
                </p>
              </div>
            </article>

            {/* Section 5 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  5
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  CAMERA ACCESS & DEVICE RESPONSIBILITY
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  You are responsible for obtaining appropriate permissions from any individuals appearing in your photo booth frames. You acknowledge that camera streams are handled locally by your device and web browser.
                </p>
              </div>
            </article>

            {/* Section 6 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  6
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  DISCLAIMER OF WARRANTIES & LIMITATION OF LIABILITY
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  PinkSnap is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied.
                </p>
                <p>
                  We do not guarantee that the service will be uninterrupted, error-free, or compatible with every camera device or browser setup. To the fullest extent permitted by law, PinkSnap and its creator shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the service.
                </p>
              </div>
            </article>

            {/* Section 7 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  7
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  MODERATION & ACCOUNT TERMINATION
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  We reserve the right to moderate, delete messages, or restrict access to any user who violates these Terms or engages in behavior that threatens the safety and enjoyment of our community.
                </p>
              </div>
            </article>

            {/* Section 8 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  8
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  MODIFICATIONS & CONTACT
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  We may update these Terms periodically to reflect changes in our features or legal standards. Continued use of the website following any updates constitutes acceptance of the revised Terms.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://chon.is-a.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-xs font-black tracking-wider uppercase shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors"
                  >
                    Contact Jimson <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://github.com/hey-chon/pinksnap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-black tracking-wider uppercase hover:bg-foreground/90 transition-colors"
                  >
                    GitHub Issue / Feedback <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Back to Action Button */}
          <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/10">
            <div className="flex items-center gap-4 text-xs font-bold text-foreground/70">
              <Link href="/privacy" className="hover:text-primary transition-colors underline">
                View Privacy Policy
              </Link>
            </div>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" /> Start Snapping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
