export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            voters: {
                Row: {
                    address: string | null;
                    date_of_birth: string | null;
                    identification_number: string;
                    is_eligible: boolean | null;
                    name: string;
                    voter_id: string;
                };
                Insert: {
                    address?: string | null;
                    date_of_birth?: string | null;
                    identification_number: string;
                    is_eligible?: boolean | null;
                    name: string;
                    voter_id?: string;
                };
                Update: {
                    address?: string | null;
                    date_of_birth?: string | null;
                    identification_number?: string;
                    is_eligible?: boolean | null;
                    name?: string;
                    voter_id?: string;
                };
                Relationships: [];
            };

            github_issues: {
                Row: {
                    issue_id: string;
                    github_issue_number: number;
                    repository_owner: string;
                    repository_name: string;
                    title: string;
                    body: string | null;
                    branch_name: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    issue_id?: string;
                    github_issue_number: number;
                    repository_owner: string;
                    repository_name: string;
                    title: string;
                    body?: string | null;
                    branch_name?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    issue_id?: string;
                    github_issue_number?: number;
                    repository_owner?: string;
                    repository_name?: string;
                    title?: string;
                    body?: string | null;
                    branch_name?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            issue_votes: {
                Row: {
                    vote_id: string;
                    issue_id: string;
                    voter_id: string;
                    vote_type: Database["public"]["Enums"]["vote_type"];
                    created_at: string;
                };
                Insert: {
                    vote_id?: string;
                    issue_id: string;
                    voter_id: string;
                    vote_type: Database["public"]["Enums"]["vote_type"];
                    created_at?: string;
                };
                Update: {
                    vote_id?: string;
                    issue_id?: string;
                    voter_id?: string;
                    vote_type?: Database["public"]["Enums"]["vote_type"];
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "issue_votes_issue_id_fkey";
                        columns: ["issue_id"];
                        isOneToOne: false;
                        referencedRelation: "github_issues";
                        referencedColumns: ["issue_id"];
                    },
                    {
                        foreignKeyName: "issue_votes_voter_id_fkey";
                        columns: ["voter_id"];
                        isOneToOne: false;
                        referencedRelation: "voters";
                        referencedColumns: ["voter_id"];
                    },
                ];
            };
            issue_comments: {
                Row: {
                    comment_id: string;
                    issue_id: string;
                    voter_id: string;
                    comment_text: string;
                    github_comment_id: number | null;
                    created_at: string;
                };
                Insert: {
                    comment_id?: string;
                    issue_id: string;
                    voter_id: string;
                    comment_text: string;
                    github_comment_id?: number | null;
                    created_at?: string;
                };
                Update: {
                    comment_id?: string;
                    issue_id?: string;
                    voter_id?: string;
                    comment_text?: string;
                    github_comment_id?: number | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "issue_comments_issue_id_fkey";
                        columns: ["issue_id"];
                        isOneToOne: false;
                        referencedRelation: "github_issues";
                        referencedColumns: ["issue_id"];
                    },
                    {
                        foreignKeyName: "issue_comments_voter_id_fkey";
                        columns: ["voter_id"];
                        isOneToOne: false;
                        referencedRelation: "voters";
                        referencedColumns: ["voter_id"];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            vote_type: "good" | "bad";
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
              Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
          Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
            DefaultSchema["Views"])
      ? (DefaultSchema["Tables"] &
            DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema["Tables"]
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema["Tables"]
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema["Enums"]
        | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
      ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema["CompositeTypes"]
        | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
      ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {},
    },
} as const;
