// ============================================================
// TradeReach — Team member contractor resolution
// ============================================================
// Resolves the "active contractor" for any user_id.
// Owners → their own contractor row.
// Team members → their owner's contractor row.
// ============================================================

import { createAdminClient } from './supabase/server'
import type { Contractor } from '@/types'

export interface ContractorResolution {
  contractor: Contractor | null
  isTeamMember: boolean
  teamMemberId: string | null
  teamMemberRole: string | null
}

export async function getContractorForUser(userId: string): Promise<ContractorResolution> {
  const admin = createAdminClient()

  // Try owner first
  const { data: contractor } = await admin
    .from('contractors')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (contractor) {
    return { contractor, isTeamMember: false, teamMemberId: null, teamMemberRole: null }
  }

  // Try team member
  const { data: member } = await admin
    .from('team_members')
    .select('id, owner_contractor_id, role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (!member) {
    return { contractor: null, isTeamMember: false, teamMemberId: null, teamMemberRole: null }
  }

  const { data: ownerContractor } = await admin
    .from('contractors')
    .select('*')
    .eq('id', member.owner_contractor_id)
    .single()

  return {
    contractor: ownerContractor,
    isTeamMember: true,
    teamMemberId: member.id,
    teamMemberRole: member.role,
  }
}
