import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { TopNav, BottomNav } from '@/components/layout';
import CommunityChat from '@/components/community-chat';

export default function Chat() {
  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="CHAT" />
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-4xl pb-14">
          <CommunityChat />
          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground/50 hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}