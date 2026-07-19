export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      kleiner_cart_sessions: {
        Row: {
          activo: boolean
          actualizado_en: string
          created_at: string
          id: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          created_at?: string
          id?: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          created_at?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kleiner_cart_sessions_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "kleiner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kleiner_cart_items: {
        Row: {
          actualizado_en: string
          cantidad: number
          cart_id: string
          created_at: string
          id: string
          product_id: number
          volumen_ml: number
        }
        Insert: {
          actualizado_en?: string
          cantidad: number
          cart_id: string
          created_at?: string
          id?: string
          product_id: number
          volumen_ml: number
        }
        Update: {
          actualizado_en?: string
          cantidad?: number
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: number
          volumen_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "kleiner_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "kleiner_cart_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kleiner_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "kleiner_products"
            referencedColumns: ["id"]
          },
        ]
      }
      kleiner_categories: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: number
          imagen_url: string | null
          nombre: string
          orden: number
          slug: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: number
          imagen_url?: string | null
          nombre: string
          orden?: number
          slug: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: number
          imagen_url?: string | null
          nombre?: string
          orden?: number
          slug?: string
        }
        Relationships: []
      }
      kleiner_chat_logs: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          origen: string
          role: string
          session_id: string
          tool_calls: Json | null
          usuario_id: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          origen?: string
          role: string
          session_id: string
          tool_calls?: Json | null
          usuario_id?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          origen?: string
          role?: string
          session_id?: string
          tool_calls?: Json | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      kleiner_distritos: {
        Row: {
          created_at: string
          disponible: boolean
          id: number
          nombre: string
          tarifa_envio: number
          tiempo_estimado: string | null
        }
        Insert: {
          created_at?: string
          disponible?: boolean
          id?: number
          nombre: string
          tarifa_envio: number
          tiempo_estimado?: string | null
        }
        Update: {
          created_at?: string
          disponible?: boolean
          id?: number
          nombre?: string
          tarifa_envio?: number
          tiempo_estimado?: string | null
        }
        Relationships: []
      }
      kleiner_order_items: {
        Row: {
          cantidad: number
          created_at: string
          id: number
          order_id: number
          precio_unitario: number
          product_id: number
          subtotal: number
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: number
          order_id: number
          precio_unitario: number
          product_id: number
          subtotal: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: number
          order_id?: number
          precio_unitario?: number
          product_id?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "kleiner_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "kleiner_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kleiner_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "kleiner_products"
            referencedColumns: ["id"]
          },
        ]
      }
      kleiner_orders: {
        Row: {
          actualizado_en: string
          codigo_pedido: string
          creado_en: string
          culqi_charge_id: string | null
          descuento: number
          direccion_envio: string
          distrito_id: number | null
          estado: string
          estado_delivery: string | null
          id: number
          metodo_pago: string | null
          notas: string | null
          origen: string
          pagado_en: string | null
          pago_estado: string
          pago_metadata: Json | null
          repartidor_asignado: string | null
          subtotal: number
          tarifa_envio: number
          total: number
          tracking_delivery: Json | null
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          codigo_pedido: string
          creado_en?: string
          culqi_charge_id?: string | null
          descuento?: number
          direccion_envio: string
          distrito_id?: number | null
          estado?: string
          estado_delivery?: string | null
          id?: number
          metodo_pago?: string | null
          notas?: string | null
          origen?: string
          pagado_en?: string | null
          pago_estado?: string
          pago_metadata?: Json | null
          repartidor_asignado?: string | null
          subtotal: number
          tarifa_envio: number
          total: number
          tracking_delivery?: Json | null
          usuario_id: string
        }
        Update: {
          actualizado_en?: string
          codigo_pedido?: string
          creado_en?: string
          culqi_charge_id?: string | null
          descuento?: number
          direccion_envio?: string
          distrito_id?: number | null
          estado?: string
          estado_delivery?: string | null
          id?: number
          metodo_pago?: string | null
          notas?: string | null
          origen?: string
          pagado_en?: string | null
          pago_estado?: string
          pago_metadata?: Json | null
          repartidor_asignado?: string | null
          subtotal?: number
          tarifa_envio?: number
          total?: number
          tracking_delivery?: Json | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kleiner_orders_distrito_id_fkey"
            columns: ["distrito_id"]
            isOneToOne: false
            referencedRelation: "kleiner_distritos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kleiner_orders_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "kleiner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kleiner_products: {
        Row: {
          activo: boolean
          actualizado_en: string
          categoria_id: number | null
          created_at: string
          descripcion: string | null
          descripcion_corta: string | null
          destacado: boolean
          embedding: string | null
          graduacion: number | null
          id: number
          imagen_url: string | null
          imagen_urls: string[] | null
          nombre: string
          precio: number
          precio_oferta: number | null
          sabor: string | null
          slug: string
          stock: number
          volumen_ml: number | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          categoria_id?: number | null
          created_at?: string
          descripcion?: string | null
          descripcion_corta?: string | null
          destacado?: boolean
          embedding?: string | null
          graduacion?: number | null
          id?: number
          imagen_url?: string | null
          imagen_urls?: string[] | null
          nombre: string
          precio: number
          precio_oferta?: number | null
          sabor?: string | null
          slug: string
          stock?: number
          volumen_ml?: number | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          categoria_id?: number | null
          created_at?: string
          descripcion?: string | null
          descripcion_corta?: string | null
          destacado?: boolean
          embedding?: string | null
          graduacion?: number | null
          id?: number
          imagen_url?: string | null
          imagen_urls?: string[] | null
          nombre?: string
          precio?: number
          precio_oferta?: number | null
          sabor?: string | null
          slug?: string
          stock?: number
          volumen_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kleiner_products_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "kleiner_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kleiner_profiles: {
        Row: {
          actualizado_en: string
          apellido: string
          creado_en: string
          direccion: string | null
          distrito_id: number | null
          email: string
          id: string
          nombre: string
          role: string
          telefono: string | null
        }
        Insert: {
          actualizado_en?: string
          apellido?: string
          creado_en?: string
          direccion?: string | null
          distrito_id?: number | null
          email: string
          id: string
          nombre?: string
          role?: string
          telefono?: string | null
        }
        Update: {
          actualizado_en?: string
          apellido?: string
          creado_en?: string
          direccion?: string | null
          distrito_id?: number | null
          email?: string
          id?: string
          nombre?: string
          role?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kleiner_profiles_distrito_id_fkey"
            columns: ["distrito_id"]
            isOneToOne: false
            referencedRelation: "kleiner_distritos"
            referencedColumns: ["id"]
          },
        ]
      }
      kleiner_tts_cache: {
        Row: {
          char_count: number | null
          created_at: string
          hit_count: number
          r2_url: string
          text_content: string | null
          text_hash: string
        }
        Insert: {
          char_count?: number | null
          created_at?: string
          hit_count?: number
          r2_url: string
          text_content?: string | null
          text_hash: string
        }
        Update: {
          char_count?: number | null
          created_at?: string
          hit_count?: number
          r2_url?: string
          text_content?: string | null
          text_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      agregar_item_carrito: {
        Args: {
          p_cantidad: number
          p_product_id: number
          p_usuario_id: string
          p_volumen_ml: number
        }
        Returns: {
          out_cart_id: string
          out_total_items: number
        }[]
      }
      decrementar_stock_seguro: {
        Args: {
          p_cantidad: number
          p_product_id: number
        }
        Returns: {
          exitoso: boolean
          mensaje: string
          stock_restante: number
        }[]
      }
      match_kleiner_products: {
        Args: {
          match_count?: number
          min_similarity?: number
          query_embedding: string
        }
        Returns: {
          id: number
          imagen_url: string | null
          nombre: string
          precio: number
          precio_oferta: number | null
          sabor: string | null
          similarity: number
          slug: string
          stock: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
