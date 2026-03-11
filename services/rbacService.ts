import type { Member, Permission, RoleName } from '../types';
import { ROLE_PERMISSIONS } from '../constants';

// ─── Permission Check ─────────────────────────────────────────────────────────

export function hasPermission(member: Member | null, permission: Permission): boolean {
  if (!member) return false;
  const permissions = ROLE_PERMISSIONS[member.role] ?? [];
  return permissions.includes(permission);
}

export function hasAnyPermission(member: Member | null, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(member, p));
}

export function hasAllPermissions(member: Member | null, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(member, p));
}

// ─── Role Hierarchy ───────────────────────────────────────────────────────────

const ROLE_LEVELS: Record<RoleName, number> = {
  Guest: 0,
  Contributor: 1,
  Reviewer: 2,
  CommunityManager: 3,
  BoardMember: 4,
  Admin: 5,
};

export function getRoleLevel(role: RoleName): number {
  return ROLE_LEVELS[role] ?? 0;
}

export function canManage(actor: Member | null, target: Member): boolean {
  if (!actor) return false;
  if (actor.id === target.id) return false;
  return getRoleLevel(actor.role) > getRoleLevel(target.role);
}

// ─── Resource-Level Checks ────────────────────────────────────────────────────

export function canViewProfile(actor: Member | null, targetMemberId: string): boolean {
  if (!actor) return false;
  if (actor.id === targetMemberId) return hasPermission(actor, 'view_own_profile');
  return hasPermission(actor, 'view_all_profiles');
}

export function canReviewContribution(actor: Member | null, contributionMemberId: string): boolean {
  if (!actor) return false;
  if (actor.id === contributionMemberId) return false; // cannot self-review
  return hasPermission(actor, 'review_contributions');
}

export function canVoteOnProposal(actor: Member | null, authorId: string): boolean {
  if (!actor) return false;
  return hasPermission(actor, 'vote_proposals');
}

// ─── Permitted Roles for Assignment ──────────────────────────────────────────

export function getAssignableRoles(actor: Member | null): RoleName[] {
  if (!actor) return [];
  if (!hasPermission(actor, 'assign_roles')) return [];
  const actorLevel = getRoleLevel(actor.role);
  return (Object.keys(ROLE_LEVELS) as RoleName[]).filter(
    role => ROLE_LEVELS[role] < actorLevel
  );
}
