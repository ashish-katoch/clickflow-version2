import React, { useState, useEffect, useCallback } from 'react';
import { getMembers, updateMemberRole } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, Shield, User, Eye } from '@phosphor-icons/react';

const ROLE_STYLES = {
  admin: { label: 'Admin', class: 'bg-blue-100 text-blue-800', icon: Shield },
  member: { label: 'Member', class: 'bg-slate-100 text-slate-700', icon: User },
  viewer: { label: 'Viewer', class: 'bg-amber-100 text-amber-800', icon: Eye },
};

export default function MembersPage() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRoleChange = async (memberId, role) => {
    try {
      await updateMemberRole(memberId, role);
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading members...</div>;

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="members-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Team Members</h1>
        <p className="text-sm text-slate-500 mt-1">{members.length} member{members.length !== 1 ? 's' : ''} in your workspace</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-3 border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide font-semibold text-slate-500">
          <div className="col-span-5">Member</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-4">Joined</div>
        </div>

        {/* Member Rows */}
        {members.map(member => {
          const roleInfo = ROLE_STYLES[member.role] || ROLE_STYLES.member;
          const RoleIcon = roleInfo.icon;
          const isCurrentUser = member.id === currentUser?.id;
          const isAdmin = currentUser?.role === 'admin';

          return (
            <div key={member.id} className="grid grid-cols-12 px-6 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center" data-testid={`member-row-${member.id}`}>
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">{member.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {member.name || 'Unnamed'}
                    {isCurrentUser && <span className="text-xs text-slate-400 ml-1">(you)</span>}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{member.email}</div>
                </div>
              </div>
              <div className="col-span-3">
                {isAdmin && !isCurrentUser ? (
                  <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v)}>
                    <SelectTrigger className="h-8 w-[120px] border-slate-200 text-xs" data-testid={`role-select-${member.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="secondary" className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${roleInfo.class}`}>
                    <RoleIcon size={10} weight="fill" className="mr-1" /> {roleInfo.label}
                  </Badge>
                )}
              </div>
              <div className="col-span-4 text-xs text-slate-500">
                {member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
