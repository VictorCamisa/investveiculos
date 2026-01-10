export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          module: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          module?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          module?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_events: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string | null
          id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_costs: {
        Row: {
          amount: number | null
          channel: string | null
          created_at: string | null
          date: string | null
          id: string
        }
        Insert: {
          amount?: number | null
          channel?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
        }
        Update: {
          amount?: number | null
          channel?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
        }
        Relationships: []
      }
      commission_audit_log: {
        Row: {
          action: string | null
          changed_by: string | null
          commission_id: string | null
          created_at: string | null
          id: string
          new_status: string | null
          previous_status: string | null
        }
        Insert: {
          action?: string | null
          changed_by?: string | null
          commission_id?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
        }
        Update: {
          action?: string | null
          changed_by?: string | null
          commission_id?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_audit_log_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "sale_commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          fixed_value: number | null
          id: string
          min_profit_percentage: number | null
          percentage: number | null
          role: string | null
        }
        Insert: {
          fixed_value?: number | null
          id?: string
          min_profit_percentage?: number | null
          percentage?: number | null
          role?: string | null
        }
        Update: {
          fixed_value?: number | null
          id?: string
          min_profit_percentage?: number | null
          percentage?: number | null
          role?: string | null
        }
        Relationships: []
      }
      commission_splits: {
        Row: {
          amount: number | null
          id: string
          percentage: number | null
          sale_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          id?: string
          percentage?: number | null
          sale_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          id?: string
          percentage?: number | null
          sale_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_splits_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sale_profit_report"
            referencedColumns: ["sale_id"]
          },
          {
            foreignKeyName: "commission_splits_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string | null
          description: string
          id: string
          reference_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          description: string
          id?: string
          reference_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string
          id?: string
          reference_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_executions: {
        Row: {
          current_step: number | null
          flow_id: string | null
          id: string
          lead_id: string | null
          next_run_at: string | null
          status: string | null
        }
        Insert: {
          current_step?: number | null
          flow_id?: string | null
          id?: string
          lead_id?: string | null
          next_run_at?: string | null
          status?: string | null
        }
        Update: {
          current_step?: number | null
          flow_id?: string | null
          id?: string
          lead_id?: string | null
          next_run_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_executions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "follow_up_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_executions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_flows: {
        Row: {
          created_at: string | null
          id: string
          name: string
          steps: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          steps?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          steps?: Json | null
        }
        Relationships: []
      }
      google_ad_groups: {
        Row: {
          campaign_id: string | null
          id: string
          name: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          id: string
          name?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      google_ads: {
        Row: {
          ad_group_id: string | null
          id: string
          name: string | null
          status: string | null
        }
        Insert: {
          ad_group_id?: string | null
          id: string
          name?: string | null
          status?: string | null
        }
        Update: {
          ad_group_id?: string | null
          id?: string
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      google_campaigns: {
        Row: {
          budget: number | null
          id: string
          name: string | null
          status: string | null
        }
        Insert: {
          budget?: number | null
          id: string
          name?: string | null
          status?: string | null
        }
        Update: {
          budget?: number | null
          id?: string
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      google_insights: {
        Row: {
          ad_id: string | null
          clicks: number | null
          date: string | null
          id: string
          impressions: number | null
          spend: number | null
        }
        Insert: {
          ad_id?: string | null
          clicks?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          spend?: number | null
        }
        Update: {
          ad_id?: string | null
          clicks?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          spend?: number | null
        }
        Relationships: []
      }
      google_sync_logs: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      lead_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          lead_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_costs: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          lead_id: string | null
          source: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          source?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_costs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          email: string | null
          first_response_at: string | null
          id: string
          last_interaction_at: string | null
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          name: string | null
          notes: string | null
          phone: string | null
          qualification_reason: string | null
          qualification_status: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          vehicle_interest: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          email?: string | null
          first_response_at?: string | null
          id?: string
          last_interaction_at?: string | null
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          qualification_reason?: string | null
          qualification_status?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_interest?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          email?: string | null
          first_response_at?: string | null
          id?: string
          last_interaction_at?: string | null
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          qualification_reason?: string | null
          qualification_status?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_interest?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_recovery_executions: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          rule_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          rule_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          rule_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loss_recovery_executions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loss_recovery_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "loss_recovery_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_recovery_rules: {
        Row: {
          action_to_take: string | null
          id: string
          name: string | null
          trigger_condition: string | null
        }
        Insert: {
          action_to_take?: string | null
          id?: string
          name?: string | null
          trigger_condition?: string | null
        }
        Update: {
          action_to_take?: string | null
          id?: string
          name?: string | null
          trigger_condition?: string | null
        }
        Relationships: []
      }
      marketing_alerts: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          message: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_alerts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          end_date: string | null
          id: string
          name: string
          platform: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          budget?: number | null
          end_date?: string | null
          id?: string
          name: string
          platform?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          budget?: number | null
          end_date?: string | null
          id?: string
          name?: string
          platform?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      meta_ads: {
        Row: {
          adset_id: string | null
          id: string
          name: string | null
          status: string | null
        }
        Insert: {
          adset_id?: string | null
          id: string
          name?: string | null
          status?: string | null
        }
        Update: {
          adset_id?: string | null
          id?: string
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      meta_adsets: {
        Row: {
          campaign_id: string | null
          id: string
          name: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          id: string
          name?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      meta_campaigns: {
        Row: {
          budget: number | null
          id: string
          name: string | null
          status: string | null
        }
        Insert: {
          budget?: number | null
          id: string
          name?: string | null
          status?: string | null
        }
        Update: {
          budget?: number | null
          id?: string
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      meta_insights: {
        Row: {
          ad_id: string | null
          clicks: number | null
          date: string | null
          id: string
          impressions: number | null
          spend: number | null
        }
        Insert: {
          ad_id?: string | null
          clicks?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          spend?: number | null
        }
        Update: {
          ad_id?: string | null
          clicks?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          spend?: number | null
        }
        Relationships: []
      }
      meta_sync_logs: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      negotiations: {
        Row: {
          actual_close_date: string | null
          appointment_date: string | null
          appointment_time: string | null
          created_at: string | null
          customer_id: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          loss_reason: string | null
          notes: string | null
          objections: string[] | null
          probability: number | null
          salesperson_id: string | null
          showed_up: boolean | null
          status: string | null
          structured_loss_reason: string | null
          updated_at: string | null
          value_offered: number | null
          vehicle_id: string | null
        }
        Insert: {
          actual_close_date?: string | null
          appointment_date?: string | null
          appointment_time?: string | null
          created_at?: string | null
          customer_id?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          loss_reason?: string | null
          notes?: string | null
          objections?: string[] | null
          probability?: number | null
          salesperson_id?: string | null
          showed_up?: boolean | null
          status?: string | null
          structured_loss_reason?: string | null
          updated_at?: string | null
          value_offered?: number | null
          vehicle_id?: string | null
        }
        Update: {
          actual_close_date?: string | null
          appointment_date?: string | null
          appointment_time?: string | null
          created_at?: string | null
          customer_id?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          loss_reason?: string | null
          notes?: string | null
          objections?: string[] | null
          probability?: number | null
          salesperson_id?: string | null
          showed_up?: boolean | null
          status?: string | null
          structured_loss_reason?: string | null
          updated_at?: string | null
          value_offered?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negotiations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_master: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_master?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_master?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      round_robin_config: {
        Row: {
          current_count: number | null
          daily_limit: number | null
          id: string
          is_active: boolean | null
          last_assigned_at: string | null
          priority: number | null
          user_id: string | null
        }
        Insert: {
          current_count?: number | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_assigned_at?: string | null
          priority?: number | null
          user_id?: string | null
        }
        Update: {
          current_count?: number | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_assigned_at?: string | null
          priority?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_robin_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_commissions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          sale_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          sale_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          sale_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sale_profit_report"
            referencedColumns: ["sale_id"]
          },
          {
            foreignKeyName: "sale_commissions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payment_methods: {
        Row: {
          amount: number
          details: string | null
          id: string
          method: string
          sale_id: string | null
        }
        Insert: {
          amount: number
          details?: string | null
          id?: string
          method: string
          sale_id?: string | null
        }
        Update: {
          amount?: number
          details?: string | null
          id?: string
          method?: string
          sale_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_payment_methods_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sale_profit_report"
            referencedColumns: ["sale_id"]
          },
          {
            foreignKeyName: "sale_payment_methods_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          profit: number | null
          sale_date: string | null
          sale_price: number
          seller_id: string | null
          status: string | null
          total_costs: number | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          profit?: number | null
          sale_date?: string | null
          sale_price: number
          seller_id?: string | null
          status?: string | null
          total_costs?: number | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          profit?: number | null
          sale_date?: string | null
          sale_price?: number
          seller_id?: string | null
          status?: string | null
          total_costs?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      salesperson_goals: {
        Row: {
          created_at: string | null
          id: string
          month: number | null
          target_count: number | null
          target_value: number | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month?: number | null
          target_count?: number | null
          target_value?: number | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number | null
          target_count?: number | null
          target_value?: number | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "salesperson_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          id: string
          module: string
          permission: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          module: string
          permission: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          module?: string
          permission?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_costs: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          description: string
          id: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          description: string
          id?: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          description?: string
          id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_costs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_images: {
        Row: {
          created_at: string | null
          id: string
          is_main: boolean | null
          order_index: number | null
          url: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_main?: boolean | null
          order_index?: number | null
          url: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_main?: boolean | null
          order_index?: number | null
          url?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_interest_alerts: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          max_price: number | null
          min_price: number | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_interest_alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_simulations: {
        Row: {
          created_at: string | null
          customer_name: string | null
          down_payment: number | null
          id: string
          installment_value: number | null
          installments: number | null
          interest_rate: number | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          down_payment?: number | null
          id?: string
          installment_value?: number | null
          installments?: number | null
          interest_rate?: number | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          down_payment?: number | null
          id?: string
          installment_value?: number | null
          installments?: number | null
          interest_rate?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_simulations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          chassis: string | null
          color: string | null
          created_at: string | null
          description: string | null
          fuel_type: string | null
          id: string
          mileage: number | null
          model: string
          plate: string | null
          price_purchase: number | null
          price_sale: number | null
          renavam: string | null
          status: string | null
          transmission: string | null
          updated_at: string | null
          version: string | null
          year_manufacture: number | null
          year_model: number | null
        }
        Insert: {
          brand: string
          chassis?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          fuel_type?: string | null
          id?: string
          mileage?: number | null
          model: string
          plate?: string | null
          price_purchase?: number | null
          price_sale?: number | null
          renavam?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          version?: string | null
          year_manufacture?: number | null
          year_model?: number | null
        }
        Update: {
          brand?: string
          chassis?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          fuel_type?: string | null
          id?: string
          mileage?: number | null
          model?: string
          plate?: string | null
          price_purchase?: number | null
          price_sale?: number | null
          renavam?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          version?: string | null
          year_manufacture?: number | null
          year_model?: number | null
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          name: string | null
          phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          name?: string | null
          phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          name?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string | null
          id: string
          instance_key: string | null
          name: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_key?: string | null
          name: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_key?: string | null
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          contact_id: string | null
          content: string | null
          created_at: string | null
          direction: string | null
          id: string
        }
        Insert: {
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
        }
        Update: {
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          content?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      sale_profit_report: {
        Row: {
          brand: string | null
          model: string | null
          net_profit: number | null
          sale_date: string | null
          sale_id: string | null
          sale_price: number | null
          total_costs: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_user_role: {
        Args: { check_role: string; check_user_id: string }
        Returns: boolean
      }
      get_my_role: { Args: never; Returns: string }
      has_role: { Args: { role_name: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
