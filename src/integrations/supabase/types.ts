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
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          module: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          module?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          module?: string | null
          user_agent?: string | null
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
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_agent_conversations: {
        Row: {
          agent_id: string
          channel: string | null
          ended_at: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          session_id: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          agent_id: string
          channel?: string | null
          ended_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          session_id: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          agent_id?: string
          channel?: string | null
          ended_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          session_id?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_data_sources: {
        Row: {
          agent_id: string
          connection_config: Json | null
          created_at: string | null
          embedding_column: string | null
          embedding_model: string | null
          embeddings_enabled: boolean | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          source_type: string
          sync_status: string | null
          table_name: string | null
          text_column: string | null
        }
        Insert: {
          agent_id: string
          connection_config?: Json | null
          created_at?: string | null
          embedding_column?: string | null
          embedding_model?: string | null
          embeddings_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          source_type: string
          sync_status?: string | null
          table_name?: string | null
          text_column?: string | null
        }
        Update: {
          agent_id?: string
          connection_config?: Json | null
          created_at?: string | null
          embedding_column?: string | null
          embedding_model?: string | null
          embeddings_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          source_type?: string
          sync_status?: string | null
          table_name?: string | null
          text_column?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_data_sources_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_guardrails: {
        Row: {
          action_on_violation: string | null
          agent_id: string
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          action_on_violation?: string | null
          agent_id: string
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          action_on_violation?: string | null
          agent_id?: string
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_guardrails_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_human_takeover: {
        Row: {
          conversation_id: string | null
          id: string
          instance_id: string | null
          lead_id: string | null
          phone: string | null
          reason: string | null
          released_at: string | null
          taken_over_at: string | null
          taken_over_by: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          instance_id?: string | null
          lead_id?: string | null
          phone?: string | null
          reason?: string | null
          released_at?: string | null
          taken_over_at?: string | null
          taken_over_by?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          instance_id?: string | null
          lead_id?: string | null
          phone?: string | null
          reason?: string | null
          released_at?: string | null
          taken_over_at?: string | null
          taken_over_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_human_takeover_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_human_takeover_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_human_takeover_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_human_takeover_taken_over_by_fkey"
            columns: ["taken_over_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_human_takeover_taken_over_by_fkey"
            columns: ["taken_over_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_agent_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          thinking: string | null
          tokens_used: number | null
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          thinking?: string | null
          tokens_used?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          thinking?: string | null
          tokens_used?: number | null
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_metrics: {
        Row: {
          agent_id: string
          avg_lead_score: number | null
          avg_response_time_ms: number | null
          conversations_count: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          error_types: Json | null
          errors_count: number | null
          id: string
          leads_qualified: number | null
          tool_calls_count: Json | null
        }
        Insert: {
          agent_id: string
          avg_lead_score?: number | null
          avg_response_time_ms?: number | null
          conversations_count?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          error_types?: Json | null
          errors_count?: number | null
          id?: string
          leads_qualified?: number | null
          tool_calls_count?: Json | null
        }
        Update: {
          agent_id?: string
          avg_lead_score?: number | null
          avg_response_time_ms?: number | null
          conversations_count?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          error_types?: Json | null
          errors_count?: number | null
          id?: string
          leads_qualified?: number | null
          tool_calls_count?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_notifications: {
        Row: {
          agent_id: string
          channel: string
          channel_config: Json | null
          condition_config: Json | null
          condition_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
        }
        Insert: {
          agent_id: string
          channel: string
          channel_config?: Json | null
          condition_config?: Json | null
          condition_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Update: {
          agent_id?: string
          channel?: string
          channel_config?: Json | null
          condition_config?: Json | null
          condition_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_tests: {
        Row: {
          actual_outcome: string | null
          agent_id: string
          created_at: string | null
          executed_at: string | null
          executed_by: string | null
          expected_outcome: string | null
          id: string
          name: string
          passed: boolean | null
          scenario: Json
          test_type: string | null
        }
        Insert: {
          actual_outcome?: string | null
          agent_id: string
          created_at?: string | null
          executed_at?: string | null
          executed_by?: string | null
          expected_outcome?: string | null
          id?: string
          name: string
          passed?: boolean | null
          scenario?: Json
          test_type?: string | null
        }
        Update: {
          actual_outcome?: string | null
          agent_id?: string
          created_at?: string | null
          executed_at?: string | null
          executed_by?: string | null
          expected_outcome?: string | null
          id?: string
          name?: string
          passed?: boolean | null
          scenario?: Json
          test_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_tests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_tests_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_tests_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_agent_tools: {
        Row: {
          agent_id: string
          auth_credentials_encrypted: string | null
          auth_method: string | null
          created_at: string | null
          description: string
          endpoint_url: string | null
          function_schema: Json
          id: string
          input_mapping: Json | null
          is_active: boolean | null
          name: string
          orchestration_rules: string | null
          output_mapping: Json | null
          priority: number | null
        }
        Insert: {
          agent_id: string
          auth_credentials_encrypted?: string | null
          auth_method?: string | null
          created_at?: string | null
          description: string
          endpoint_url?: string | null
          function_schema?: Json
          id?: string
          input_mapping?: Json | null
          is_active?: boolean | null
          name: string
          orchestration_rules?: string | null
          output_mapping?: Json | null
          priority?: number | null
        }
        Update: {
          agent_id?: string
          auth_credentials_encrypted?: string | null
          auth_method?: string | null
          created_at?: string | null
          description?: string
          endpoint_url?: string | null
          function_schema?: Json
          id?: string
          input_mapping?: Json | null
          is_active?: boolean | null
          name?: string
          orchestration_rules?: string | null
          output_mapping?: Json | null
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_tools_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_workflows: {
        Row: {
          agent_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          priority: number | null
          trigger_conditions: Json | null
          workflow_definition: Json
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          priority?: number | null
          trigger_conditions?: Json | null
          workflow_definition?: Json
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          priority?: number | null
          trigger_conditions?: Json | null
          workflow_definition?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_workflows_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          api_key_encrypted: string | null
          context_window_size: number | null
          created_at: string | null
          created_by: string | null
          deployment_channels: string[] | null
          description: string | null
          embed_code: string | null
          id: string
          llm_model: string | null
          llm_provider: string | null
          long_term_memory_enabled: boolean | null
          max_tokens: number | null
          name: string
          objective: string | null
          output_format: string | null
          redis_host: string | null
          redis_password_encrypted: string | null
          redis_port: number | null
          short_term_memory_type: string | null
          status: string | null
          system_prompt: string | null
          temperature: number | null
          top_p: number | null
          transfer_keywords: string[] | null
          transfer_to_human_enabled: boolean | null
          updated_at: string | null
          vector_db_config: Json | null
          vector_db_provider: string | null
          webhook_url: string | null
          whatsapp_auto_reply: boolean | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          context_window_size?: number | null
          created_at?: string | null
          created_by?: string | null
          deployment_channels?: string[] | null
          description?: string | null
          embed_code?: string | null
          id?: string
          llm_model?: string | null
          llm_provider?: string | null
          long_term_memory_enabled?: boolean | null
          max_tokens?: number | null
          name: string
          objective?: string | null
          output_format?: string | null
          redis_host?: string | null
          redis_password_encrypted?: string | null
          redis_port?: number | null
          short_term_memory_type?: string | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          top_p?: number | null
          transfer_keywords?: string[] | null
          transfer_to_human_enabled?: boolean | null
          updated_at?: string | null
          vector_db_config?: Json | null
          vector_db_provider?: string | null
          webhook_url?: string | null
          whatsapp_auto_reply?: boolean | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          context_window_size?: number | null
          created_at?: string | null
          created_by?: string | null
          deployment_channels?: string[] | null
          description?: string | null
          embed_code?: string | null
          id?: string
          llm_model?: string | null
          llm_provider?: string | null
          long_term_memory_enabled?: boolean | null
          max_tokens?: number | null
          name?: string
          objective?: string | null
          output_format?: string | null
          redis_host?: string | null
          redis_password_encrypted?: string | null
          redis_port?: number | null
          short_term_memory_type?: string | null
          status?: string | null
          system_prompt?: string | null
          temperature?: number | null
          top_p?: number | null
          transfer_keywords?: string[] | null
          transfer_to_human_enabled?: boolean | null
          updated_at?: string | null
          vector_db_config?: Json | null
          vector_db_provider?: string | null
          webhook_url?: string | null
          whatsapp_auto_reply?: boolean | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_agents_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
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
            foreignKeyName: "commission_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
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
          {
            foreignKeyName: "commission_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          cpf_cnpj: string | null
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          lead_id: string | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          lead_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "lead_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
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
          description: string | null
          follow_up_completed: boolean | null
          follow_up_date: string | null
          id: string
          lead_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          id?: string
          lead_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
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
          {
            foreignKeyName: "lead_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lead_qualifications: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          completeness_score: number | null
          created_at: string
          decision_maker: boolean | null
          down_payment: number | null
          engagement_score: number | null
          has_trade_in: boolean | null
          id: string
          intent_score: number | null
          lead_id: string | null
          max_installment: number | null
          negotiation_id: string | null
          notes: string | null
          payment_method: string | null
          purchase_timeline: string | null
          qualified_by: string | null
          score: number
          trade_in_value: number | null
          trade_in_vehicle: string | null
          updated_at: string
          vehicle_interest: string | null
          vehicle_usage: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          completeness_score?: number | null
          created_at?: string
          decision_maker?: boolean | null
          down_payment?: number | null
          engagement_score?: number | null
          has_trade_in?: boolean | null
          id?: string
          intent_score?: number | null
          lead_id?: string | null
          max_installment?: number | null
          negotiation_id?: string | null
          notes?: string | null
          payment_method?: string | null
          purchase_timeline?: string | null
          qualified_by?: string | null
          score?: number
          trade_in_value?: number | null
          trade_in_vehicle?: string | null
          updated_at?: string
          vehicle_interest?: string | null
          vehicle_usage?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          completeness_score?: number | null
          created_at?: string
          decision_maker?: boolean | null
          down_payment?: number | null
          engagement_score?: number | null
          has_trade_in?: boolean | null
          id?: string
          intent_score?: number | null
          lead_id?: string | null
          max_installment?: number | null
          negotiation_id?: string | null
          notes?: string | null
          payment_method?: string | null
          purchase_timeline?: string | null
          qualified_by?: string | null
          score?: number
          trade_in_value?: number | null
          trade_in_vehicle?: string | null
          updated_at?: string
          vehicle_interest?: string | null
          vehicle_usage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_qualifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_qualifications_negotiation_id_fkey"
            columns: ["negotiation_id"]
            isOneToOne: false
            referencedRelation: "negotiations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_qualifications_qualified_by_fkey"
            columns: ["qualified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_qualifications_qualified_by_fkey"
            columns: ["qualified_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
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
      mercadolibre_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          refresh_token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          contact_attempts: number | null
          created_at: string | null
          customer_id: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          loss_reason: string | null
          no_show_count: number | null
          notes: string | null
          objections: string[] | null
          probability: number | null
          salesperson_id: string | null
          showed_up: boolean | null
          status: string | null
          structured_loss_reason: string | null
          test_drive_completed: boolean | null
          test_drive_scheduled: boolean | null
          updated_at: string | null
          value_offered: number | null
          vehicle_id: string | null
        }
        Insert: {
          actual_close_date?: string | null
          appointment_date?: string | null
          appointment_time?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          customer_id?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          loss_reason?: string | null
          no_show_count?: number | null
          notes?: string | null
          objections?: string[] | null
          probability?: number | null
          salesperson_id?: string | null
          showed_up?: boolean | null
          status?: string | null
          structured_loss_reason?: string | null
          test_drive_completed?: boolean | null
          test_drive_scheduled?: boolean | null
          updated_at?: string | null
          value_offered?: number | null
          vehicle_id?: string | null
        }
        Update: {
          actual_close_date?: string | null
          appointment_date?: string | null
          appointment_time?: string | null
          contact_attempts?: number | null
          created_at?: string | null
          customer_id?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          loss_reason?: string | null
          no_show_count?: number | null
          notes?: string | null
          objections?: string[] | null
          probability?: number | null
          salesperson_id?: string | null
          showed_up?: boolean | null
          status?: string | null
          structured_loss_reason?: string | null
          test_drive_completed?: boolean | null
          test_drive_scheduled?: boolean | null
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
            referencedRelation: "vehicle_dre"
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
          link: string | null
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
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
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
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
          is_active: boolean
          is_master: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          is_master?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
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
          total_leads_assigned: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_count?: number | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_assigned_at?: string | null
          priority?: number | null
          total_leads_assigned?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_count?: number | null
          daily_limit?: number | null
          id?: string
          is_active?: boolean | null
          last_assigned_at?: string | null
          priority?: number | null
          total_leads_assigned?: number | null
          updated_at?: string | null
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
          {
            foreignKeyName: "round_robin_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sale_commissions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          calculated_amount: number | null
          commission_rule_id: string | null
          created_at: string | null
          final_amount: number | null
          id: string
          manual_adjustment: number | null
          notes: string | null
          paid: boolean | null
          paid_at: string | null
          payment_due_date: string | null
          rejection_reason: string | null
          sale_id: string | null
          split_percentage: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          calculated_amount?: number | null
          commission_rule_id?: string | null
          created_at?: string | null
          final_amount?: number | null
          id?: string
          manual_adjustment?: number | null
          notes?: string | null
          paid?: boolean | null
          paid_at?: string | null
          payment_due_date?: string | null
          rejection_reason?: string | null
          sale_id?: string | null
          split_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          calculated_amount?: number | null
          commission_rule_id?: string | null
          created_at?: string | null
          final_amount?: number | null
          id?: string
          manual_adjustment?: number | null
          notes?: string | null
          paid?: boolean | null
          paid_at?: string | null
          payment_due_date?: string | null
          rejection_reason?: string | null
          sale_id?: string | null
          split_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_commissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_commissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sale_commissions_commission_rule_id_fkey"
            columns: ["commission_rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "sale_commissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_dre"
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
          {
            foreignKeyName: "salesperson_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          frequency: string
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          recipients: string[] | null
          report_type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          frequency: string
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          recipients?: string[] | null
          report_type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          frequency?: string
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          recipients?: string[] | null
          report_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          module: string
          permission: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          module: string
          permission: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          granted_at?: string
          granted_by?: string | null
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
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      utm_links: {
        Row: {
          base_url: string
          clicks: number | null
          created_at: string | null
          created_by: string | null
          full_url: string | null
          id: string
          name: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          base_url: string
          clicks?: number | null
          created_at?: string | null
          created_by?: string | null
          full_url?: string | null
          id?: string
          name: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          base_url?: string
          clicks?: number | null
          created_at?: string | null
          created_by?: string | null
          full_url?: string | null
          id?: string
          name?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "utm_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utm_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vehicle_costs: {
        Row: {
          amount: number
          cost_date: string
          cost_type: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string
          id: string
          receipt_url: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          cost_date?: string
          cost_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description: string
          id?: string
          receipt_url?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          cost_date?: string
          cost_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string
          id?: string
          receipt_url?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_costs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_dre"
            referencedColumns: ["id"]
          },
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
          display_order: number | null
          id: string
          image_url: string | null
          is_cover: boolean | null
          is_main: boolean | null
          order_index: number | null
          url: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_cover?: boolean | null
          is_main?: boolean | null
          order_index?: number | null
          url: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_cover?: boolean | null
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
            referencedRelation: "vehicle_dre"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "vehicle_dre"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "vehicle_dre"
            referencedColumns: ["id"]
          },
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
          city: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          doors: number | null
          estimated_cleaning: number | null
          estimated_documentation: number | null
          estimated_maintenance: number | null
          estimated_other_costs: number | null
          expected_margin_percent: number | null
          expected_sale_days: number | null
          featured: boolean | null
          fipe_price_at_purchase: number | null
          fuel_type: string | null
          id: string
          images: string[] | null
          km: number | null
          mercadolibre_id: string | null
          mileage: number | null
          minimum_price: number | null
          ml_item_id: string | null
          ml_listing_type: string | null
          ml_permalink: string | null
          ml_published_at: string | null
          ml_status: string | null
          model: string
          notes: string | null
          plate: string | null
          price_purchase: number | null
          price_sale: number | null
          purchase_date: string | null
          purchase_price: number | null
          purchase_source: string | null
          renavam: string | null
          state: string | null
          status: string | null
          transmission: string | null
          updated_at: string | null
          version: string | null
          year_fabrication: number | null
          year_manufacture: number | null
          year_model: number | null
          zip_code: string | null
        }
        Insert: {
          brand: string
          chassis?: string | null
          city?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          doors?: number | null
          estimated_cleaning?: number | null
          estimated_documentation?: number | null
          estimated_maintenance?: number | null
          estimated_other_costs?: number | null
          expected_margin_percent?: number | null
          expected_sale_days?: number | null
          featured?: boolean | null
          fipe_price_at_purchase?: number | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          km?: number | null
          mercadolibre_id?: string | null
          mileage?: number | null
          minimum_price?: number | null
          ml_item_id?: string | null
          ml_listing_type?: string | null
          ml_permalink?: string | null
          ml_published_at?: string | null
          ml_status?: string | null
          model: string
          notes?: string | null
          plate?: string | null
          price_purchase?: number | null
          price_sale?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_source?: string | null
          renavam?: string | null
          state?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          version?: string | null
          year_fabrication?: number | null
          year_manufacture?: number | null
          year_model?: number | null
          zip_code?: string | null
        }
        Update: {
          brand?: string
          chassis?: string | null
          city?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          doors?: number | null
          estimated_cleaning?: number | null
          estimated_documentation?: number | null
          estimated_maintenance?: number | null
          estimated_other_costs?: number | null
          expected_margin_percent?: number | null
          expected_sale_days?: number | null
          featured?: boolean | null
          fipe_price_at_purchase?: number | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          km?: number | null
          mercadolibre_id?: string | null
          mileage?: number | null
          minimum_price?: number | null
          ml_item_id?: string | null
          ml_listing_type?: string | null
          ml_permalink?: string | null
          ml_published_at?: string | null
          ml_status?: string | null
          model?: string
          notes?: string | null
          plate?: string | null
          price_purchase?: number | null
          price_sale?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          purchase_source?: string | null
          renavam?: string | null
          state?: string | null
          status?: string | null
          transmission?: string | null
          updated_at?: string | null
          version?: string | null
          year_fabrication?: number | null
          year_manufacture?: number | null
          year_model?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          last_message_at: string | null
          lead_id: string | null
          name: string | null
          phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          name?: string | null
          phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          last_message_at?: string | null
          lead_id?: string | null
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
          api_key: string | null
          api_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          instance_key: string | null
          instance_name: string | null
          is_default: boolean | null
          is_shared: boolean | null
          name: string
          phone_number: string | null
          qr_code: string | null
          qr_code_expires_at: string | null
          signature_template: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          instance_key?: string | null
          instance_name?: string | null
          is_default?: boolean | null
          is_shared?: boolean | null
          name: string
          phone_number?: string | null
          qr_code?: string | null
          qr_code_expires_at?: string | null
          signature_template?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          instance_key?: string | null
          instance_name?: string | null
          is_default?: boolean | null
          is_shared?: boolean | null
          name?: string
          phone_number?: string | null
          qr_code?: string | null
          qr_code_expires_at?: string | null
          signature_template?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "whatsapp_instances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_instances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          contact_id: string | null
          content: string | null
          created_at: string | null
          direction: string | null
          id: string
          instance_id: string | null
          lead_id: string | null
          message_id: string | null
          message_type: string | null
          remote_jid: string | null
          sent_by: string | null
          status: string | null
        }
        Insert: {
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          instance_id?: string | null
          lead_id?: string | null
          message_id?: string | null
          message_type?: string | null
          remote_jid?: string | null
          sent_by?: string | null
          status?: string | null
        }
        Update: {
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          instance_id?: string | null
          lead_id?: string | null
          message_id?: string | null
          message_type?: string | null
          remote_jid?: string | null
          sent_by?: string | null
          status?: string | null
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
          created_at: string | null
          customer_id: string | null
          days_in_stock: number | null
          gross_profit: number | null
          model: string | null
          net_profit: number | null
          plate: string | null
          profit: number | null
          sale_date: string | null
          sale_id: string | null
          sale_price: number | null
          salesperson_id: string | null
          status: string | null
          total_commissions: number | null
          total_costs: number | null
          vehicle_id: string | null
          vehicle_purchase_price: number | null
          vehicle_total_costs: number | null
          vehicle_total_investment: number | null
          year_model: number | null
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
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salesperson_ranking"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_dre"
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
      salesperson_ranking: {
        Row: {
          avg_profit_per_sale: number | null
          full_name: string | null
          revenue_this_month: number | null
          sales_this_month: number | null
          total_commissions: number | null
          total_profit: number | null
          total_revenue: number | null
          total_sales: number | null
          user_id: string | null
        }
        Relationships: []
      }
      vehicle_dre: {
        Row: {
          brand: string | null
          cost_aquisicao: number | null
          cost_comissao_compra: number | null
          cost_documentacao: number | null
          cost_frete: number | null
          cost_ipva: number | null
          cost_limpeza: number | null
          cost_manutencao: number | null
          cost_outros: number | null
          cost_transferencia: number | null
          created_at: string | null
          days_in_stock: number | null
          estimated_cleaning: number | null
          estimated_documentation: number | null
          estimated_maintenance: number | null
          estimated_other_costs: number | null
          expected_margin_percent: number | null
          expected_sale_days: number | null
          holding_cost: number | null
          id: string | null
          model: string | null
          plate: string | null
          purchase_date: string | null
          purchase_price: number | null
          sale_price: number | null
          status: string | null
          total_estimated_costs: number | null
          total_investment: number | null
          total_real_costs: number | null
          updated_at: string | null
          year_model: number | null
        }
        Insert: {
          brand?: string | null
          cost_aquisicao?: never
          cost_comissao_compra?: never
          cost_documentacao?: never
          cost_frete?: never
          cost_ipva?: never
          cost_limpeza?: never
          cost_manutencao?: never
          cost_outros?: never
          cost_transferencia?: never
          created_at?: string | null
          days_in_stock?: never
          estimated_cleaning?: number | null
          estimated_documentation?: number | null
          estimated_maintenance?: number | null
          estimated_other_costs?: number | null
          expected_margin_percent?: number | null
          expected_sale_days?: number | null
          holding_cost?: never
          id?: string | null
          model?: string | null
          plate?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          sale_price?: number | null
          status?: string | null
          total_estimated_costs?: never
          total_investment?: never
          total_real_costs?: never
          updated_at?: string | null
          year_model?: number | null
        }
        Update: {
          brand?: string | null
          cost_aquisicao?: never
          cost_comissao_compra?: never
          cost_documentacao?: never
          cost_frete?: never
          cost_ipva?: never
          cost_limpeza?: never
          cost_manutencao?: never
          cost_outros?: never
          cost_transferencia?: never
          created_at?: string | null
          days_in_stock?: never
          estimated_cleaning?: number | null
          estimated_documentation?: number | null
          estimated_maintenance?: number | null
          estimated_other_costs?: number | null
          expected_margin_percent?: number | null
          expected_sale_days?: number | null
          holding_cost?: never
          id?: string | null
          model?: string | null
          plate?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          sale_price?: number | null
          status?: string | null
          total_estimated_costs?: never
          total_investment?: never
          total_real_costs?: never
          updated_at?: string | null
          year_model?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_user_role: {
        Args: { check_role: string; check_user_id: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_my_role: { Args: never; Returns: string }
      get_next_round_robin_salesperson: { Args: never; Returns: string }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          module: string
          permissions: string[]
        }[]
      }
      has_permission: {
        Args: { _module: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { role_name: string }; Returns: boolean }
      increment_round_robin_counters: {
        Args: { p_salesperson_id: string }
        Returns: undefined
      }
      is_master_user: { Args: { _user_id: string }; Returns: boolean }
      log_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
        }
        Returns: string
      }
      reset_daily_lead_counts: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "gerente" | "vendedor" | "marketing"
      commission_type:
        | "percentual_lucro"
        | "valor_fixo"
        | "escalonada"
        | "mista"
      lead_source:
        | "website"
        | "indicacao"
        | "facebook"
        | "instagram"
        | "google_ads"
        | "olx"
        | "webmotors"
        | "outros"
        | "whatsapp"
      lead_status:
        | "novo"
        | "contato_inicial"
        | "qualificado"
        | "proposta"
        | "negociacao"
        | "convertido"
        | "perdido"
      loss_reason_type:
        | "sem_entrada"
        | "sem_credito"
        | "curioso"
        | "caro"
        | "comprou_outro"
        | "desistiu"
        | "sem_contato"
        | "veiculo_vendido"
        | "outros"
      negotiation_status:
        | "em_andamento"
        | "proposta_enviada"
        | "negociando"
        | "ganho"
        | "perdido"
        | "pausado"
      payment_method:
        | "dinheiro"
        | "pix"
        | "cartao_credito"
        | "cartao_debito"
        | "financiamento"
        | "consorcio"
        | "permuta"
        | "misto"
      qualification_status: "nao_qualificado" | "qualificado" | "desqualificado"
      sale_status: "pendente" | "concluida" | "cancelada"
      vehicle_cost_type:
        | "aquisicao"
        | "documentacao"
        | "transferencia"
        | "ipva"
        | "manutencao"
        | "limpeza"
        | "frete"
        | "comissao_compra"
        | "outros"
      vehicle_status: "disponivel" | "reservado" | "vendido" | "em_manutencao"
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
    Enums: {
      app_role: ["gerente", "vendedor", "marketing"],
      commission_type: [
        "percentual_lucro",
        "valor_fixo",
        "escalonada",
        "mista",
      ],
      lead_source: [
        "website",
        "indicacao",
        "facebook",
        "instagram",
        "google_ads",
        "olx",
        "webmotors",
        "outros",
        "whatsapp",
      ],
      lead_status: [
        "novo",
        "contato_inicial",
        "qualificado",
        "proposta",
        "negociacao",
        "convertido",
        "perdido",
      ],
      loss_reason_type: [
        "sem_entrada",
        "sem_credito",
        "curioso",
        "caro",
        "comprou_outro",
        "desistiu",
        "sem_contato",
        "veiculo_vendido",
        "outros",
      ],
      negotiation_status: [
        "em_andamento",
        "proposta_enviada",
        "negociando",
        "ganho",
        "perdido",
        "pausado",
      ],
      payment_method: [
        "dinheiro",
        "pix",
        "cartao_credito",
        "cartao_debito",
        "financiamento",
        "consorcio",
        "permuta",
        "misto",
      ],
      qualification_status: [
        "nao_qualificado",
        "qualificado",
        "desqualificado",
      ],
      sale_status: ["pendente", "concluida", "cancelada"],
      vehicle_cost_type: [
        "aquisicao",
        "documentacao",
        "transferencia",
        "ipva",
        "manutencao",
        "limpeza",
        "frete",
        "comissao_compra",
        "outros",
      ],
      vehicle_status: ["disponivel", "reservado", "vendido", "em_manutencao"],
    },
  },
} as const
