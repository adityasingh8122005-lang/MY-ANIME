import React, { useEffect, useState } from 'react';
import { ShieldAlert, Users, MessageSquare, Trash2, MessageCircle, BarChart, LogOut, ToggleRight } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

export default function AdminPanelPage() {
  const { toggleAdminMode } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, analytics, moderation
  
  const [totalUsers, setTotalUsers] = useState(0);
  const [userDirectory, setUserDirectory] = useState([]);
  
  const [recentChats, setRecentChats] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [recentTheories, setRecentTheories] = useState([]);
  
  const [animeStats, setAnimeStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Load user directory
      const { data: usersData, count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
        
      setTotalUsers(usersCount || 0);
      setUserDirectory(usersData || []);

      // Load Moderation
      const [{ data: chats }, { data: comments }, { data: theories }] = await Promise.all([
        supabase.from('anime_chat').select('*, profiles!anime_chat_user_id_fkey(username)').order('created_at', { ascending: false }).limit(20),
        supabase.from('anime_comments').select('*, profiles!anime_comments_user_id_fkey(username)').order('created_at', { ascending: false }).limit(20),
        supabase.from('anime_theories').select('*, profiles!anime_theories_user_id_fkey(username)').order('created_at', { ascending: false }).limit(20),
      ]);

      setRecentChats(chats || []);
      setRecentComments(comments || []);
      setRecentTheories(theories || []);
      
      // Load Anime Global Popularity (Aggregating user_anime)
      // Since RLS allows admins to read all user_anime rows, we can fetch them and process them.
      // If the DB gets huge, we'd want a SQL view or RPC, but this works for now.
      const { data: allAnime } = await supabase.from('user_anime').select('user_id, mal_id, franchise_id, personal_status');
      const { data: allFranchises } = await supabase.from('franchises').select('franchise_id, franchise_name');
      
      if (allAnime) {
        const franchiseDict = {};
        if (allFranchises) {
          allFranchises.forEach(f => {
            franchiseDict[f.franchise_id] = f.franchise_name;
          });
        }

        const userGroups = {};
        const statusPriority = {
          'Watching': 5,
          'Plan to Watch': 4,
          'On Hold': 3,
          'Completed': 2,
          'Watched': 2,
          'Dropped': 1
        };

        allAnime.forEach(row => {
          const groupId = row.franchise_id ? `f_${row.franchise_id}` : `m_${row.mal_id}`;
          if (!userGroups[row.user_id]) userGroups[row.user_id] = {};
          
          if (!userGroups[row.user_id][groupId]) {
            userGroups[row.user_id][groupId] = row.personal_status;
          } else {
            const currentStatus = userGroups[row.user_id][groupId];
            if ((statusPriority[row.personal_status] || 0) > (statusPriority[currentStatus] || 0)) {
              userGroups[row.user_id][groupId] = row.personal_status;
            }
          }
        });

        const statsMap = {};
        Object.values(userGroups).forEach(userGroup => {
          Object.entries(userGroup).forEach(([groupId, status]) => {
            if (!statsMap[groupId]) {
              statsMap[groupId] = { 
                groupId, 
                isFranchise: groupId.startsWith('f_'),
                refId: groupId.startsWith('f_') ? groupId.substring(2) : parseInt(groupId.substring(2)),
                total: 0, watching: 0, completed: 0, plan: 0, hold: 0, dropped: 0, 
                title: 'Loading...' 
              };
            }
            statsMap[groupId].total++;
            
            if (status === 'Watching') statsMap[groupId].watching++;
            else if (status === 'Completed' || status === 'Watched') statsMap[groupId].completed++;
            else if (status === 'Plan to Watch') statsMap[groupId].plan++;
            else if (status === 'On Hold') statsMap[groupId].hold++;
            else if (status === 'Dropped') statsMap[groupId].dropped++;
          });
        });

        const statsArr = Object.values(statsMap).sort((a, b) => b.total - a.total).slice(0, 50);

        const missingMalIds = [];
        statsArr.forEach(stat => {
          if (stat.isFranchise) {
            stat.title = franchiseDict[stat.refId] || `Unknown Franchise (ID: ${stat.refId})`;
          } else {
            missingMalIds.push(stat.refId);
          }
        });

        if (missingMalIds.length > 0) {
          try {
            const query = `
              query ($idMal_in: [Int]) {
                Page(page: 1, perPage: 50) {
                  media(idMal_in: $idMal_in, type: ANIME) {
                    idMal
                    title {
                      english
                      romaji
                    }
                  }
                }
              }
            `;
            const response = await fetch('https://graphql.anilist.co', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, variables: { idMal_in: missingMalIds } })
            });
            const json = await response.json();
            const mediaList = json.data?.Page?.media || [];
            
            statsArr.forEach(stat => {
              if (!stat.isFranchise) {
                const media = mediaList.find(m => m.idMal === stat.refId);
                if (media && media.title) {
                  stat.title = media.title.english || media.title.romaji || 'Unknown Title';
                } else {
                  stat.title = 'Unknown Title (ID: ' + stat.refId + ')';
                }
              }
            });
          } catch(e) {
            console.error('Failed to fetch standalone anime titles:', e);
            statsArr.forEach(s => {
              if (!s.isFranchise) s.title = 'Unknown Anime';
            });
          }
        }
        
        setAnimeStats(statsArr);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const deleteChat = async (id) => {
    await supabase.from('anime_chat').delete().eq('id', id);
    setRecentChats(c => c.filter(x => x.id !== id));
  };
  const deleteComment = async (id) => {
    await supabase.from('anime_comments').delete().eq('id', id);
    setRecentComments(c => c.filter(x => x.id !== id));
  };
  const deleteTheory = async (id) => {
    await supabase.from('anime_theories').delete().eq('id', id);
    setRecentTheories(c => c.filter(x => x.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Admin Navbar */}
      <div className="border-b border-red-900/30 bg-red-950/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red-500" />
            <h1 className="text-xl font-bold font-mono tracking-wider text-red-500">ADMIN SYSTEM</h1>
          </div>
          <button 
            onClick={toggleAdminMode}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-sm transition-colors"
          >
            <ToggleRight className="text-green-500" /> Exit Admin Mode
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors", activeTab === 'overview' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "hover:bg-zinc-900 text-zinc-400")}>
            <BarChart size={18} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('users')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors", activeTab === 'users' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "hover:bg-zinc-900 text-zinc-400")}>
            <Users size={18} /> User Directory
          </button>
          <button onClick={() => setActiveTab('analytics')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors", activeTab === 'analytics' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "hover:bg-zinc-900 text-zinc-400")}>
            <BarChart size={18} /> Anime Analytics
          </button>
          <button onClick={() => setActiveTab('moderation')} className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors", activeTab === 'moderation' ? "bg-red-500/10 text-red-400 border border-red-500/20" : "hover:bg-zinc-900 text-zinc-400")}>
            <ShieldAlert size={18} /> Moderation
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-zinc-500 text-sm font-semibold uppercase mb-1">Total Users</h3>
                  <p className="text-4xl font-bold text-white">{totalUsers}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-zinc-500 text-sm font-semibold uppercase mb-1">Global Anime Tracked</h3>
                  <p className="text-4xl font-bold text-white">{animeStats.reduce((sum, s) => sum + s.total, 0)}+</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-zinc-500 text-sm font-semibold uppercase mb-1">Recent Chats</h3>
                  <p className="text-4xl font-bold text-white">{recentChats.length}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="text-red-500" /> User Directory</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">User</th>
                      <th className="px-6 py-4 font-semibold">Joined Date</th>
                      <th className="px-6 py-4 font-semibold">Public Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {userDirectory.map(user => (
                      <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <img src={user.avatar_url || 'https://via.placeholder.com/40'} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                          <div>
                            <p className="text-white font-medium">@{user.username || 'unknown'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={clsx("px-2 py-1 rounded text-xs font-medium", user.is_public ? "bg-green-500/10 text-green-400" : "bg-zinc-800 text-zinc-400")}>
                            {user.is_public ? 'Public' : 'Private'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart className="text-red-500" /> Anime Popularity</h2>
              <p className="text-zinc-400 text-sm">Global aggregation of user libraries.</p>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Anime</th>
                      <th className="px-6 py-4 font-semibold text-center text-blue-400">Watching</th>
                      <th className="px-6 py-4 font-semibold text-center text-green-400">Completed</th>
                      <th className="px-6 py-4 font-semibold text-center text-yellow-400">Plan To Watch</th>
                      <th className="px-6 py-4 font-semibold text-center text-red-400">Dropped</th>
                      <th className="px-6 py-4 font-semibold text-center">Total Adds</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {animeStats.map(stat => (
                      <tr key={stat.groupId} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-white max-w-xs truncate" title={stat.title}>
                          <div className="line-clamp-2">{stat.title}</div>
                        </td>
                        <td className="px-6 py-4 text-center text-blue-400">{stat.watching}</td>
                        <td className="px-6 py-4 text-center text-green-400">{stat.completed}</td>
                        <td className="px-6 py-4 text-center text-yellow-400">{stat.plan}</td>
                        <td className="px-6 py-4 text-center text-red-400">{stat.dropped}</td>
                        <td className="px-6 py-4 text-center font-bold">{stat.total}</td>
                      </tr>
                    ))}
                    {animeStats.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-zinc-500">No anime stats found. Users haven't added any anime yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="text-red-500" /> Content Moderation</h2>
              
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2">Recent Chats</h3>
                <div className="space-y-3">
                  {recentChats.map(chat => (
                    <div key={chat.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-start gap-4">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">@{chat.profiles?.username || 'user'} • Anime {chat.mal_id}</div>
                        <div className="text-sm text-zinc-200 break-words">{chat.message}</div>
                      </div>
                      <button onClick={() => deleteChat(chat.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors shrink-0" title="Delete Content">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {recentChats.length === 0 && <p className="text-zinc-500 text-sm">No recent chats.</p>}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-zinc-800 pb-2">Recent Comments / Theories</h3>
                <div className="space-y-3">
                  {recentComments.map(c => (
                    <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-start gap-4">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Comment by @{c.profiles?.username || 'user'} • Anime {c.mal_id}</div>
                        <div className="text-sm text-zinc-200 break-words">{c.content}</div>
                      </div>
                      <button onClick={() => deleteComment(c.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {recentTheories.map(t => (
                    <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-start gap-4">
                      <div>
                        <div className="text-xs text-purple-500 mb-1">Theory by @{t.profiles?.username || 'user'} • Anime {t.mal_id}</div>
                        <div className="text-sm text-zinc-200 break-words">{t.content}</div>
                      </div>
                      <button onClick={() => deleteTheory(t.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded transition-colors shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
