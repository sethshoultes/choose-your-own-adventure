export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      api_credentials: {
        Row: {
          id: string
          user_id: string
          openai_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          openai_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          openai_key?: string
          created_at?: string
          updated_at?: string
        }
      }
      characters: {
        Row: {
          id: string
          user_id: string
          name: string
          genre: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          genre: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          genre?: string
          created_at?: string
          updated_at?: string
        }
      }
      game_history: {
        Row: {
          id: string
          session_id: string
          scene_description: string
          player_choice: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          scene_description: string
          player_choice: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          scene_description?: string
          player_choice?: string
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          character_id: string
          current_scene: Json
          game_state: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          character_id: string
          current_scene: Json
          game_state: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          character_id?: string
          current_scene?: Json
          game_state?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}