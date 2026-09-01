import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { TopNav, BottomNav } from '@/components/layout';
import { openCookieSettings } from '@/components/cookie-notice';
import {
  ShieldCheck,
  Camera,
  Database,
  Lock,
  Cookie,
  UserCheck,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Sliders,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AuthGateModal } from '@/components/auth/auth-gate-modal';

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showAuthGate, setShowAuthGate] = useState(false);
  const lastUpdated = 'August 2026';

  const handleStartSnapping = () => {
    if (isAuthenticated) {
      navigate('/setup');
    } else {
      setShowAuthGate(true);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh]">
      {showAuthGate && (
        <AuthGateModal
          onClose={() => setShowAuthGate(false)}
          onSuccess={() => { setShowAuthGate(false); navigate('/setup'); }}
        />
      )}
      <TopNav backTo="/" title="PRIVACY POLICY" />

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-10 flex flex-col items-center">
        <div className="max-w-4xl w-full py-4 sm:py-8 space-y-8">
          {/* Header Banner */}
          <div className="text-center">
            <h1 className="font-display text-[2.5rem] leading-[.95] sm:text-5xl md:text-6xl text-foreground">
              PRIVACY <span className="text-primary">POLICY</span>
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[.15em] text-foreground/60 mt-3">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Key Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="ticket p-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Camera className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg tracking-wide text-foreground mb-1">LOCAL SNAPS</h2>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  Your photo booth captures and video streams are processed 100% inside your browser. Uploads only happen when you explicitly choose to upload an optional profile avatar.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-primary mt-3 inline-block">Avatar Upload Is Optional</span>
            </div>

            <div className="ticket p-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg tracking-wide text-foreground mb-1">LOCAL STORAGE</h2>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  Strips and style preferences are saved in your browser's localStorage for instant access and privacy.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-primary mt-3 inline-block">On-Device Only</span>
            </div>

            <div className="ticket p-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg tracking-wide text-foreground mb-1">SIMPLE AUTH</h2>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  If you create an optional account, authentication is securely managed via Supabase.
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-primary mt-3 inline-block">Secure & Minimal</span>
            </div>

            <div className="ticket p-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Cookie className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg tracking-wide text-foreground mb-1">YOUR CHOICE</h2>
                <p className="text-xs text-foreground/70 font-medium leading-relaxed">
                  Customize and adjust cookie and storage preferences anytime with one click.
                </p>
              </div>
              <button
                type="button"
                onClick={openCookieSettings}
                className="text-[10px] font-black uppercase text-primary hover:underline mt-3 inline-flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" /> Manage Cookies
              </button>
            </div>
          </div>

          {/* Comprehensive Content Sections */}
          <div className="space-y-6">
            {/* Section 1 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  1
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  INTRODUCTION & PURPOSE
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  Welcome to <strong>PinkSnap</strong> (available at pink-snap.dev and associated domains). PinkSnap is an interactive, browser-based virtual photo booth created and maintained by Jimson.
                </p>
                <p>
                  We are deeply committed to protecting your personal privacy. Because PinkSnap was built with user respect at its foundation, the application operates primarily on client-side technology only. PinkSnap do not sell your personal data, run intrusive tracking networks, or monetize your private moments.
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
                  CAMERA ACCESS & PHOTO PROCESSING
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  To provide the core photobooth experience, PinkSnap requests permission from your web browser to access your device's camera.
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/75">
                  <li><strong>Local Processing Only:</strong> Camera streams, image capture previews, filters, and photo strip compositing run entirely in your local browser memory (HTML5 Canvas & WebRTC APIs).</li>
                  <li><strong>No Secret Server Uploads:</strong> Photos captured during your booth session are <em>never</em> sent to remote servers or cloud databases without your explicit request.</li>
                  <li><strong>Optional Avatar Upload:</strong> If you upload a profile picture, that specific image is stored in Supabase Storage and displayed publicly as your avatar.</li>
                  <li><strong>Saving & Exporting:</strong> When you download or save your photo strip, the image file is generated directly on your device.</li>
                  <li><strong>Permission Revocation:</strong> You can revoke camera permissions at any moment via your browser's site settings.</li>
                </ul>
              </div>
            </article>

            {/* Section 3 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  3
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  DATA WE COLLECT & HOW IT IS USED
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  Depending on how you use PinkSnap, the following minimal information may be processed:
                </p>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white/50 border border-black/5">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" /> Optional Member Account
                    </h3>
                    <p className="text-xs text-foreground/70 mt-1">
                      If you sign up for an account, we store your email address, chosen display name, user ID, and optional avatar metadata via Supabase Authentication to manage your session and role permissions.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/50 border border-black/5">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" /> Community Chat Messages
                    </h3>
                    <p className="text-xs text-foreground/70 mt-1">
                      If you participate in the community chat, your message text, timestamp, and display name/avatar are broadcasted via Supabase Realtime to other chat participants. Automated profanity filtering and moderation rules are applied.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/50 border border-black/5">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Database className="w-4 h-4 text-primary" /> Local Storage Data
                    </h3>
                    <p className="text-xs text-foreground/70 mt-1">
                      PinkSnap utilizes browser <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-[11px]">localStorage</code> to remember your selected booth layouts, template styling, sound effects toggle, recent gallery strip previews, and cookie preferences.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 4 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  4
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  COOKIES & LOCAL STORAGE PREFERENCES
                </h2>
              </div>
              <div className="space-y-4 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  PinkSnap uses essential storage tokens to keep your authentication session active and to preserve your photobooth workspace.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <div>
                    <h3 className="font-display text-lg text-foreground">NEED TO CHANGE YOUR PREFERENCES?</h3>
                    <p className="text-xs text-foreground/70">
                      You can adjust your cookie and storage preferences at any time.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCookieSettings}
                    className="shrink-0 inline-flex items-center gap-2 bg-primary text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" /> Open Cookie Settings
                  </button>
                </div>
              </div>
            </article>

            {/* Section 5 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  5
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  THIRD-PARTY SERVICES & SUBPROCESSORS
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  To deliver a reliable and secure experience, PinkSnap utilizes trusted infrastructure providers:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2 text-foreground/75">
                  <li><strong>Supabase:</strong> Provides managed authentication, relational database storage for chat messages/profile metadata, realtime synchronization, and public profile avatar storage.</li>
                  <li><strong>Netlify / Hosting Infrastructure:</strong> Delivers frontend application assets, SSL/TLS encryption, and static content distribution.</li>
                  <li><strong>Font Providers:</strong> Self-hosted and bundled typography (Inter, Bebas Neue, Press Start 2P) without external tracking.</li>
                </ul>
              </div>
            </article>

            {/* Section 6 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  6
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  DATA RETENTION, DELETION & YOUR RIGHTS
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  You have full rights over your data:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/75">
                  <li><strong>Local Gallery & Cache:</strong> You can clear your local photo strips and booth state at any time by clearing your browser cache or deleting local storage.</li>
                  <li><strong>Account Deletion:</strong> If you registered an account and wish to delete your profile and associated data, you can request deletion by contacting us.</li>
                  <li><strong>Chat Messages:</strong> Messages posted to community chat remain in the public room history unless removed by an administrator or moderator for violations.</li>
                </ul>
              </div>
            </article>

            {/* Section 7 */}
            <article className="credit-card rounded-3xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg">
                  7
                </div>
                <h2 className="font-display text-2xl text-foreground tracking-wide">
                  CONTACT INFORMATION
                </h2>
              </div>
              <div className="space-y-3 text-sm text-foreground/80 leading-relaxed font-medium">
                <p>
                  If you have any questions, feedback, or data privacy requests regarding PinkSnap, please feel free to reach out directly:
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://chon.is-a.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-xs font-black tracking-wider uppercase shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors"
                  >
                    Jimson's Portfolio <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://www.facebook.com/share/1NrJVrJBDJ/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-xs font-black tracking-wider uppercase hover:bg-foreground/90 transition-colors"
                  >
                    Facebook <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Back to Action Button */}
          <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/10">
            <div className="flex items-center gap-4 text-xs font-bold text-foreground/70">
              <Link href="/terms" className="hover:text-primary transition-colors underline">
                View Terms of Service
              </Link>
              <span>•</span>
              <button
                type="button"
                onClick={openCookieSettings}
                className="hover:text-primary transition-colors underline cursor-pointer"
              >
                Cookie Preferences
              </button>
            </div>
            <button
              type="button"
              onClick={handleStartSnapping}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" /> Start Snapping <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
