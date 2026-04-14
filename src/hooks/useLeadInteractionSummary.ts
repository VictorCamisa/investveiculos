import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeadInteractionSummary {
  lead_id: string;
  last_message_at: string | null;
  last_received_at: string | null;
  last_sent_at: string | null;
  has_unanswered: boolean;
  total_messages: number;
}

/**
 * Fetches interaction summary (last message, unanswered status) for a batch of lead IDs.
 * Uses whatsapp_messages table which has direction field.
 */
export function useLeadInteractionSummaries(leadIds: string[]) {
  return useQuery({
    queryKey: ['lead-interaction-summaries', leadIds.sort().join(',')],
    queryFn: async (): Promise<Record<string, LeadInteractionSummary>> => {
      if (!leadIds.length) return {};

      // Fetch last messages per lead with direction info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('whatsapp_messages')
        .select('lead_id, direction, created_at')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) {
        console.warn('[useLeadInteractionSummaries] Error:', error);
        return {};
      }

      const summaryMap: Record<string, LeadInteractionSummary> = {};

      // Initialize all lead IDs
      for (const id of leadIds) {
        summaryMap[id] = {
          lead_id: id,
          last_message_at: null,
          last_received_at: null,
          last_sent_at: null,
          has_unanswered: false,
          total_messages: 0,
        };
      }

      // Process messages (already sorted desc by created_at)
      for (const msg of (data || []) as { lead_id: string; direction: string; created_at: string }[]) {
        const summary = summaryMap[msg.lead_id];
        if (!summary) continue;

        summary.total_messages++;

        // First occurrence = latest
        if (!summary.last_message_at) {
          summary.last_message_at = msg.created_at;
        }

        if (msg.direction === 'incoming' && !summary.last_received_at) {
          summary.last_received_at = msg.created_at;
        }

        if (msg.direction === 'outgoing' && !summary.last_sent_at) {
          summary.last_sent_at = msg.created_at;
        }
      }

      // Determine unanswered: last message is incoming (client sent, we didn't reply)
      for (const id of leadIds) {
        const s = summaryMap[id];
        if (s.last_received_at && s.last_message_at === s.last_received_at) {
          // Last message was from the client
          if (!s.last_sent_at || new Date(s.last_received_at) > new Date(s.last_sent_at)) {
            s.has_unanswered = true;
          }
        }
      }

      return summaryMap;
    },
    enabled: leadIds.length > 0,
    staleTime: 30_000, // 30s cache
    refetchInterval: 60_000, // auto-refresh every minute
  });
}
