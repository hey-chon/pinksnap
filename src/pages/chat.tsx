import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { TopNav, BottomNav } from '@/components/layout';
import CommunityChat from '@/components/community-chat';
import ChatUsersDirectory from '@/components/chat-users-directory';

export default function Chat() {
  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="CHAT" />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:py-8 flex flex-col items-center justify-start lg:justify-center">
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto my-auto pb-10 flex flex-col lg:flex-row items-stretch lg:items-start justify-center gap-6 xl:gap-8">
          {/* Left Side: PINKSNAP Users Directory & Stalk Wall Leaderboard (Desktop & Laptop View) */}
          <aside className="hidden lg:block w-[310px] xl:w-[340px] shrink-0">
            <ChatUsersDirectory />
          </aside>

          {/* Right Side: Community Chat (Dominant & Wider) */}
          <div className="w-full flex-1 min-w-0 max-w-2xl flex flex-col items-center">
            <CommunityChat />
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground/50 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
