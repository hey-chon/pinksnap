import { Link } from 'wouter';
import { ArrowLeft, Users } from 'lucide-react';
import { TopNav, BottomNav } from '@/components/layout';
import CommunityChat from '@/components/community-chat';
import ChatUsersDirectory from '@/components/chat-users-directory';
import { ChatAxolotlGuide } from '@/components/chat-axolotl-guide';

export default function Chat() {
  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="CHAT" />

      <main className="flex-1 overflow-y-auto px-3.5 py-5 sm:px-6 sm:py-7 flex flex-col items-center justify-start lg:justify-center">
        <div className="w-full max-w-[1600px] mx-auto my-auto pb-8 flex flex-col lg:flex-row items-center lg:items-center justify-center gap-6 xl:gap-10">
          
          {/* ── LEFT SIDE: Big Axolotl (Desktop) ── */}
          <section
            aria-label="PinkSnap Axolotl Mascot"
            className="w-full lg:w-[380px] xl:w-[440px] 2xl:w-[480px] shrink-0 flex flex-col items-center justify-center"
          >
            <ChatAxolotlGuide />

            <div className="mt-4 hidden lg:block text-center">
              
            </div>
          </section>

          {/* ── RIGHT SIDE: Community Chat & PinkSnap Users Directory ── */}
          <section
            aria-label="Community Messages and Users"
            className="flex-1 min-w-0 flex flex-col xl:flex-row items-stretch xl:items-start justify-center gap-5 xl:gap-6"
          >
            {/* Community Chat Panel (Dominant) */}
            <div className="flex-1 min-w-0 max-w-2xl xl:max-w-3xl w-full flex flex-col items-center mx-auto xl:mx-0">
              <CommunityChat />

              <div className="mt-5 block lg:hidden text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground/50 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
                </Link>
              </div>
            </div>

            {/* PINKSNAP Users Directory (Right Column Sidebar on Desktop) */}
            <aside className="w-full xl:w-[270px] 2xl:w-[300px] shrink-0 max-w-2xl mx-auto xl:mx-0">
              <ChatUsersDirectory />
            </aside>
          </section>

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
