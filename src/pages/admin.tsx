import { useState, useEffect, useCallback, useMemo } from 'react';
import { TopNav, BottomNav } from '@/components/layout';
import { useAuth } from '@/hooks/use-auth';
import { useAppContext } from '@/lib/store';
import { useToast } from '@/hooks/use-toast.tsx';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/auth';
import {
  Shield,
  Users,
  Camera,
  AlertTriangle,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Link } from 'wouter';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  joined: string;
  status: 'active' | 'pending';
  isCurrentUser?: boolean;
}

export default function AdminPage() {
  const { user } = useAuth();
  const { savedMemories } = useAppContext();
  const { toast } = useToast();

  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);



  const loadAccounts = useCallback(async (showToast = false) => {
    setIsLoadingUsers(true);
    if (showToast) setIsRefreshing(true);

    try {
      const mergedMap = new Map<string, UserRecord>();

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[Admin] Supabase fetch profiles error:', error.message);
        } else if (data && data.length > 0) {
          data.forEach((p: any) => {
            const emailKey = (p.email || '').toLowerCase();
            mergedMap.set(p.id, {
              id: p.id,
              email: p.email || '',
              name: p.display_name || p.email?.split('@')[0] || 'User',
              role: (p.role as UserRole) || 'user',
              joined: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent',
              status: 'active',
              isCurrentUser: user?.id === p.id || user?.email?.toLowerCase() === emailKey,
            });
          });
        }
      } catch (err) {
        console.warn('[Admin] Could not query profiles table:', err);
      }

      if (user && !mergedMap.has(user.id)) {
        mergedMap.set(user.id, {
          id: user.id,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role: user.role,
          joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today',
          status: 'active',
          isCurrentUser: true,
        });
      }

      const list = Array.from(mergedMap.values());
      list.sort((a, b) => {
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return a.name.localeCompare(b.name);
      });

      setUsersList(list);

      if (showToast) {
        toast({
          title: 'Accounts Refreshed',
          description: `Loaded ${list.length} registered accounts.`,
        });
      }
    } catch (err) {
      console.error('Failed to load accounts in admin:', err);
    } finally {
      setIsLoadingUsers(false);
      setIsRefreshing(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadAccounts();

    const channel = supabase
      .channel('admin_profiles_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadAccounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAccounts]);

  const openEditModal = (target: UserRecord) => {
    setEditingUser(target);
    setEditName(target.name);
    setEditRole(target.role);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingEdit(true);

    const updatedName = editName.trim() || editingUser.name;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updatedName,
          role: editRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setUsersList(prev =>
        prev.map(u =>
          u.id === editingUser.id
            ? { ...u, name: updatedName, role: editRole }
            : u
        )
      );

      toast({
        title: 'Account Updated',
        description: `Successfully updated ${updatedName}.`,
      });
      setEditingUser(null);
    } catch (err: any) {
      console.error('Failed to update account:', err);
      toast({
        title: 'Update Failed',
        description: err?.message || 'Could not update account in database.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    if (deletingUser.isCurrentUser) {
      toast({
        title: 'Action Prohibited',
        description: 'You cannot delete your own active administrator account.',
        variant: 'destructive',
      });
      setDeletingUser(null);
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', deletingUser.id);
      if (error) throw error;

      setUsersList(prev => prev.filter(u => u.id !== deletingUser.id));
      toast({
        title: 'Account Deleted',
        description: `Account for ${deletingUser.email} has been deleted.`,
      });
      setDeletingUser(null);
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      toast({
        title: 'Delete Failed',
        description: err?.message || 'Could not remove account from database.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };


  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return usersList;
    const q = searchQuery.toLowerCase().trim();
    return usersList.filter(
      u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [usersList, searchQuery]);

  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/profile" title="ADMIN PANEL" />

      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          {/* Admin Header */}
          <div className="ticket p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-600 border border-purple-300 flex items-center justify-center shadow-inner">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <span className="booth-heading-kicker mb-1 bg-purple-100 text-purple-700">
                  Role: Administrator
                </span>
                <h1 className="font-display text-3xl sm:text-4xl text-foreground">
                  CONTROL <span className="text-purple-600">CENTER</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadAccounts(true)}
                disabled={isRefreshing}
                title="Refresh accounts from database"
                className="px-3.5 py-2 bg-white/70 hover:bg-white text-foreground text-xs font-black uppercase tracking-wider rounded-xl border border-black/10 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                <span>Refresh</span>
              </button>
              <Link
                href="/profile"
                className="px-4 py-2 bg-white/70 hover:bg-white text-foreground text-xs font-black uppercase tracking-wider rounded-xl border border-black/10 transition-colors"
              >
                Back to Profile
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="ticket p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Total Accounts</span>
                <p className="font-display text-2xl text-foreground">{usersList.length} Registered</p>
              </div>
            </div>

            <div className="ticket p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-primary flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">Local Memories</span>
                <p className="font-display text-2xl text-foreground">{savedMemories.length} Strips</p>
              </div>
            </div>
          </div>

          {/* Accounts Management */}
          <div className="ticket p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" /> ACCOUNTS & PERMISSIONS
                </h2>
                <p className="text-xs text-foreground/60 font-medium">
                  All accounts registered in the photobooth system ({filteredUsers.length} shown).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search accounts..."
                    className="pl-8 pr-3 py-1.5 bg-white border border-black/15 rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-44 sm:w-56"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Add User Button */}


              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingUsers ? (
                <div className="py-8 text-center text-foreground/50 text-xs flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading accounts...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-foreground/50 text-xs">
                  No accounts match &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black/10 text-foreground/60 uppercase tracking-wider text-[10px] font-black">
                      <th className="pb-3 px-2">User</th>
                      <th className="pb-3 px-2">Email</th>
                      <th className="pb-3 px-2">Account Type</th>
                      <th className="pb-3 px-2">Joined</th>
                      <th className="pb-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className={`transition-colors ${u.isCurrentUser ? 'bg-primary/5 font-semibold' : 'hover:bg-black/[0.02]'}`}>
                        <td className="py-3.5 px-2 font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center ${
                              u.isCurrentUser ? 'bg-primary text-white shadow-sm' : 'bg-primary/20 text-primary'
                            }`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[9px] font-black uppercase">
                                  YOU
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 font-mono text-foreground/70">{u.email}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {u.role === 'admin' ? 'Administrator' : 'Member'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-foreground/60 font-mono">{u.joined}</td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* Inline Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              title="Edit user"
                              aria-label={`Edit ${u.name}`}
                              className="p-1.5 rounded-lg text-foreground/60 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Inline Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              disabled={u.isCurrentUser}
                              title={u.isCurrentUser ? "You cannot delete your own account" : "Delete user"}
                              aria-label={`Delete ${u.name}`}
                              className={`p-1.5 rounded-lg border border-transparent transition-all ${
                                u.isCurrentUser
                                  ? 'text-foreground/20 cursor-not-allowed'
                                  : 'text-foreground/60 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Edit Account Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="ticket max-w-md w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="font-display text-xl text-foreground">EDIT ACCOUNT</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-full hover:bg-black/5 text-foreground/50 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/70 mb-1">
                  Email Address (Read-only)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3.5 py-2 bg-black/5 border border-black/10 rounded-xl text-xs font-mono text-foreground/70"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/70 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-black/15 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-foreground/70 mb-1.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['user', 'admin'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditRole(r)}
                      className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                        editRole === r
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-foreground/70 border-black/10 hover:bg-black/5'
                      }`}
                    >
                      {r === 'admin' ? 'Administrator' : 'Member'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-white/70 hover:bg-white text-foreground text-xs font-black uppercase tracking-wider rounded-xl border border-black/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="ticket max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive border border-destructive/20 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-display text-xl text-foreground">DELETE ACCOUNT?</h3>
              <p className="text-xs text-foreground/70 mt-1">
                Are you sure you want to delete <strong className="text-foreground">{deletingUser.name}</strong> (<code>{deletingUser.email}</code>)?
              </p>
              <p className="text-[11px] text-destructive/80 font-medium mt-1">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-black/10">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-white/70 hover:bg-white text-foreground text-xs font-black uppercase tracking-wider rounded-xl border border-black/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-destructive text-destructive-foreground text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-destructive/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}



      <BottomNav />
    </div>
  );
}
