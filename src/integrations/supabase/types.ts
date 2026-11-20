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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ajustes_club: {
        Row: {
          cuota_socio: number | null
          email_avisos: string
          email_club: string
          id: boolean
          nombre_club: string
          temporada_actual: string
          url_clasificacion_futgal: string
          url_twitch: string
          whatsapp_club: string
        }
        Insert: {
          cuota_socio?: number | null
          email_avisos?: string
          email_club?: string
          id?: boolean
          nombre_club?: string
          temporada_actual?: string
          url_clasificacion_futgal?: string
          url_twitch?: string
          whatsapp_club?: string
        }
        Update: {
          cuota_socio?: number | null
          email_avisos?: string
          email_club?: string
          id?: boolean
          nombre_club?: string
          temporada_actual?: string
          url_clasificacion_futgal?: string
          url_twitch?: string
          whatsapp_club?: string
        }
        Relationships: []
      }
      avisos: {
        Row: {
          destinatarios: string
          id: string
          publicado_at: string
          texto: string
          tipo: string
          titulo: string
        }
        Insert: {
          destinatarios?: string
          id?: string
          publicado_at?: string
          texto: string
          tipo: string
          titulo: string
        }
        Update: {
          destinatarios?: string
          id?: string
          publicado_at?: string
          texto?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      avisos_leidos: {
        Row: {
          aviso_id: string
          socio_id: string | null
          user_id: string
        }
        Insert: {
          aviso_id: string
          socio_id?: string | null
          user_id: string
        }
        Update: {
          aviso_id?: string
          socio_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_leidos_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_leidos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      clasificacion_club: {
        Row: {
          actualizado_at: string
          actualizado_por: string | null
          id: string
          jornada: number
          posicion: number
        }
        Insert: {
          actualizado_at?: string
          actualizado_por?: string | null
          id?: string
          jornada?: number
          posicion: number
        }
        Update: {
          actualizado_at?: string
          actualizado_por?: string | null
          id?: string
          jornada?: number
          posicion?: number
        }
        Relationships: []
      }
      emails_log: {
        Row: {
          asunto: string
          clave: string
          creado_at: string
          destinatario: string
          enviado_at: string | null
          error: string | null
          estado: string
          id: string
          intentos: number
          provider_id: string | null
        }
        Insert: {
          asunto: string
          clave: string
          creado_at?: string
          destinatario: string
          enviado_at?: string | null
          error?: string | null
          estado?: string
          id?: string
          intentos?: number
          provider_id?: string | null
        }
        Update: {
          asunto?: string
          clave?: string
          creado_at?: string
          destinatario?: string
          enviado_at?: string | null
          error?: string | null
          estado?: string
          id?: string
          intentos?: number
          provider_id?: string | null
        }
        Relationships: []
      }
      equipo_invitaciones: {
        Row: {
          email: string
          estado: string
          fecha_alta: string
          id: string
          nombre: string
          socio_id: string | null
          user_id: string | null
        }
        Insert: {
          email: string
          estado?: string
          fecha_alta?: string
          id?: string
          nombre: string
          socio_id?: string | null
          user_id?: string | null
        }
        Update: {
          email?: string
          estado?: string
          fecha_alta?: string
          id?: string
          nombre?: string
          socio_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipo_invitaciones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_cache: {
        Row: {
          id: string
          payload: Json
          updated_at: string
        }
        Insert: {
          id: string
          payload: Json
          updated_at?: string
        }
        Update: {
          id?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pagos: {
        Row: {
          creado_at: string
          detalle_metodo: string | null
          estado: string
          fecha_pago: string
          id: string
          importe: number
          metodo: string
          reembolsado_at: string | null
          referencia: string | null
          registrado_por: string | null
          socio_id: string
          temporada: string
        }
        Insert: {
          creado_at?: string
          detalle_metodo?: string | null
          estado?: string
          fecha_pago: string
          id?: string
          importe: number
          metodo: string
          reembolsado_at?: string | null
          referencia?: string | null
          registrado_por?: string | null
          socio_id: string
          temporada: string
        }
        Update: {
          creado_at?: string
          detalle_metodo?: string | null
          estado?: string
          fecha_pago?: string
          id?: string
          importe?: number
          metodo?: string
          reembolsado_at?: string | null
          referencia?: string | null
          registrado_por?: string | null
          socio_id?: string
          temporada?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      partidos: {
        Row: {
          competicion: string | null
          drive_folder_id: string | null
          es_local: boolean
          fecha_confirmada: boolean
          fecha_hora: string | null
          goles_contra: number | null
          goles_favor: number | null
          hora_confirmada: boolean
          id: string
          jornada: number | null
          jugado: boolean
          lugar: string
          pabellon: string
          resultado: string | null
          rival: string
        }
        Insert: {
          competicion?: string | null
          drive_folder_id?: string | null
          es_local?: boolean
          fecha_confirmada?: boolean
          fecha_hora?: string | null
          goles_contra?: number | null
          goles_favor?: number | null
          hora_confirmada?: boolean
          id?: string
          jornada?: number | null
          jugado?: boolean
          lugar?: string
          pabellon?: string
          resultado?: string | null
          rival: string
        }
        Update: {
          competicion?: string | null
          drive_folder_id?: string | null
          es_local?: boolean
          fecha_confirmada?: boolean
          fecha_hora?: string | null
          goles_contra?: number | null
          goles_favor?: number | null
          hora_confirmada?: boolean
          id?: string
          jornada?: number | null
          jugado?: boolean
          lugar?: string
          pabellon?: string
          resultado?: string | null
          rival?: string
        }
        Relationships: []
      }
      password_cambios: {
        Row: {
          password_anterior: string
          user_id: string
        }
        Insert: {
          password_anterior: string
          user_id: string
        }
        Update: {
          password_anterior?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_cambios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patrocinadores: {
        Row: {
          activo: boolean
          categoria: string
          detalle_baja: string | null
          direccion: string
          email_acceso: string | null
          fecha_alta: string
          fecha_baja: string | null
          id: string
          importe_patrocinio: number
          logo_url: string
          motivo_baja: string | null
          nombre: string
          pin_hash: string
        }
        Insert: {
          activo?: boolean
          categoria?: string
          detalle_baja?: string | null
          direccion?: string
          email_acceso?: string | null
          fecha_alta?: string
          fecha_baja?: string | null
          id?: string
          importe_patrocinio?: number
          logo_url?: string
          motivo_baja?: string | null
          nombre: string
          pin_hash: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          detalle_baja?: string | null
          direccion?: string
          email_acceso?: string | null
          fecha_alta?: string
          fecha_baja?: string | null
          id?: string
          importe_patrocinio?: number
          logo_url?: string
          motivo_baja?: string | null
          nombre?: string
          pin_hash?: string
        }
        Relationships: []
      }
      pin_intentos: {
        Row: {
          intentos: number
          user_id: string
          ventana: string
        }
        Insert: {
          intentos?: number
          user_id: string
          ventana?: string
        }
        Update: {
          intentos?: number
          user_id?: string
          ventana?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          debe_cambiar_password: boolean
          dispositivo_id: string | null
          email: string | null
          estado: string
          fecha_alta: string
          id: string
          nombre: string
          patrocinador_id: string | null
          socio_id: string | null
          tiene_password: boolean
        }
        Insert: {
          debe_cambiar_password?: boolean
          dispositivo_id?: string | null
          email?: string | null
          estado?: string
          fecha_alta?: string
          id: string
          nombre?: string
          patrocinador_id?: string | null
          socio_id?: string | null
          tiene_password?: boolean
        }
        Update: {
          debe_cambiar_password?: boolean
          dispositivo_id?: string | null
          email?: string | null
          estado?: string
          fecha_alta?: string
          id?: string
          nombre?: string
          patrocinador_id?: string | null
          socio_id?: string | null
          tiene_password?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "patrocinadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: true
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_permisos: {
        Row: {
          accion: string
          actor_id: string | null
          afectado_id: string
          fecha: string
          id: string
          motivo: string
          patrocinador_id: string | null
        }
        Insert: {
          accion: string
          actor_id?: string | null
          afectado_id: string
          fecha?: string
          id?: string
          motivo?: string
          patrocinador_id?: string | null
        }
        Update: {
          accion?: string
          actor_id?: string | null
          afectado_id?: string
          fecha?: string
          id?: string
          motivo?: string
          patrocinador_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registro_permisos_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "patrocinadores"
            referencedColumns: ["id"]
          },
        ]
      }
      socios: {
        Row: {
          cambio_dispositivo: boolean
          carnet_fisico: string
          consentimiento_at: string | null
          dispositivo_id: string | null
          email: string | null
          es_prueba: boolean
          estado: string
          fecha_activacion: string | null
          fecha_alta: string
          fecha_baja: string | null
          fecha_entrega: string | null
          id: string
          mayor_de_edad: boolean
          motivo_baja: string | null
          nombre: string
          numero_socio: number
          telefono: string
          temporada: string
          token_invitacion: string
          ultima_apertura: string | null
        }
        Insert: {
          cambio_dispositivo?: boolean
          carnet_fisico?: string
          consentimiento_at?: string | null
          dispositivo_id?: string | null
          email?: string | null
          es_prueba?: boolean
          estado?: string
          fecha_activacion?: string | null
          fecha_alta?: string
          fecha_baja?: string | null
          fecha_entrega?: string | null
          id?: string
          mayor_de_edad?: boolean
          motivo_baja?: string | null
          nombre: string
          numero_socio?: number
          telefono?: string
          temporada?: string
          token_invitacion?: string
          ultima_apertura?: string | null
        }
        Update: {
          cambio_dispositivo?: boolean
          carnet_fisico?: string
          consentimiento_at?: string | null
          dispositivo_id?: string | null
          email?: string | null
          es_prueba?: boolean
          estado?: string
          fecha_activacion?: string | null
          fecha_alta?: string
          fecha_baja?: string | null
          fecha_entrega?: string | null
          id?: string
          mayor_de_edad?: boolean
          motivo_baja?: string | null
          nombre?: string
          numero_socio?: number
          telefono?: string
          temporada?: string
          token_invitacion?: string
          ultima_apertura?: string | null
        }
        Relationships: []
      }
      solicitudes_socios: {
        Row: {
          consentimiento_at: string
          creado_at: string
          email: string
          estado: string
          id: string
          mayor_de_edad: boolean
          nombre: string
          pago_origen: string | null
          pago_referencia: string | null
          socio_id: string | null
          telefono: string
          temporada: string
        }
        Insert: {
          consentimiento_at?: string
          creado_at?: string
          email: string
          estado?: string
          id?: string
          mayor_de_edad: boolean
          nombre: string
          pago_origen?: string | null
          pago_referencia?: string | null
          socio_id?: string | null
          telefono?: string
          temporada?: string
        }
        Update: {
          consentimiento_at?: string
          creado_at?: string
          email?: string
          estado?: string
          id?: string
          mayor_de_edad?: boolean
          nombre?: string
          pago_origen?: string | null
          pago_referencia?: string | null
          socio_id?: string | null
          telefono?: string
          temporada?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_socios_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_checkouts: {
        Row: {
          auth_nuevo: boolean
          consentimiento_at: string
          creado_at: string
          email: string
          es_prueba: boolean
          id: string
          importe_centimos: number
          nombre: string
          pagado_at: string | null
          password_claimed_at: string | null
          password_saved_at: string | null
          session_id: string | null
          socio_id: string | null
          telefono: string
          temporada: string
          user_id: string | null
        }
        Insert: {
          auth_nuevo?: boolean
          consentimiento_at?: string
          creado_at?: string
          email: string
          es_prueba: boolean
          id?: string
          importe_centimos: number
          nombre: string
          pagado_at?: string | null
          password_claimed_at?: string | null
          password_saved_at?: string | null
          session_id?: string | null
          socio_id?: string | null
          telefono?: string
          temporada: string
          user_id?: string | null
        }
        Update: {
          auth_nuevo?: boolean
          consentimiento_at?: string
          creado_at?: string
          email?: string
          es_prueba?: boolean
          id?: string
          importe_centimos?: number
          nombre?: string
          pagado_at?: string | null
          password_claimed_at?: string | null
          password_saved_at?: string | null
          session_id?: string | null
          socio_id?: string | null
          telefono?: string
          temporada?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_checkouts_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_eventos: {
        Row: {
          creado_at: string
          error: string | null
          estado: string
          event_id: string
          procesado_at: string | null
          session_id: string | null
          socio_id: string | null
          tipo: string
        }
        Insert: {
          creado_at?: string
          error?: string | null
          estado?: string
          event_id: string
          procesado_at?: string | null
          session_id?: string | null
          socio_id?: string | null
          tipo: string
        }
        Update: {
          creado_at?: string
          error?: string | null
          estado?: string
          event_id?: string
          procesado_at?: string | null
          session_id?: string | null
          socio_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_eventos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["club_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["club_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuario_roles: {
        Row: {
          activo: boolean
          creado_at: string
          creado_por: string | null
          email: string
          id: string
          nombre: string
          patrocinador_id: string | null
          rol: Database["public"]["Enums"]["club_role"]
          socio_id: string | null
          user_id: string | null
        }
        Insert: {
          activo?: boolean
          creado_at?: string
          creado_por?: string | null
          email: string
          id?: string
          nombre?: string
          patrocinador_id?: string | null
          rol: Database["public"]["Enums"]["club_role"]
          socio_id?: string | null
          user_id?: string | null
        }
        Update: {
          activo?: boolean
          creado_at?: string
          creado_por?: string | null
          email?: string
          id?: string
          nombre?: string
          patrocinador_id?: string | null
          rol?: Database["public"]["Enums"]["club_role"]
          socio_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_roles_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "patrocinadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_roles_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_vista: {
        Row: {
          patrocinador_prueba: string | null
          role_id: string
          session_id: string
          user_id: string
        }
        Insert: {
          patrocinador_prueba?: string | null
          role_id: string
          session_id: string
          user_id: string
        }
        Update: {
          patrocinador_prueba?: string | null
          role_id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_vista_patrocinador_prueba_fkey"
            columns: ["patrocinador_prueba"]
            isOneToOne: false
            referencedRelation: "patrocinadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_vista_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "usuario_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ventajas: {
        Row: {
          activa: boolean
          condiciones: string
          descripcion: string
          destacado: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          patrocinador_id: string
          tarifas: Json | null
          titulo: string
        }
        Insert: {
          activa?: boolean
          condiciones?: string
          descripcion?: string
          destacado?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          patrocinador_id: string
          tarifas?: Json | null
          titulo: string
        }
        Update: {
          activa?: boolean
          condiciones?: string
          descripcion?: string
          destacado?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          patrocinador_id?: string
          tarifas?: Json | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventajas_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "patrocinadores"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas: {
        Row: {
          anulada: boolean
          es_prueba: boolean
          fecha: string | null
          fecha_hora: string
          id: string
          origen: string
          patrocinador_id: string
          repite_via_club: boolean
          socio_eliminado: boolean
          socio_id: string | null
          tipo_cliente: string
          tramo_gasto: string | null
          ventaja_id: string | null
          verificada: boolean
        }
        Insert: {
          anulada?: boolean
          es_prueba?: boolean
          fecha?: string | null
          fecha_hora?: string
          id?: string
          origen: string
          patrocinador_id: string
          repite_via_club?: boolean
          socio_eliminado?: boolean
          socio_id?: string | null
          tipo_cliente: string
          tramo_gasto?: string | null
          ventaja_id?: string | null
          verificada?: boolean
        }
        Update: {
          anulada?: boolean
          es_prueba?: boolean
          fecha?: string | null
          fecha_hora?: string
          id?: string
          origen?: string
          patrocinador_id?: string
          repite_via_club?: boolean
          socio_eliminado?: boolean
          socio_id?: string | null
          tipo_cliente?: string
          tramo_gasto?: string | null
          ventaja_id?: string | null
          verificada?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "visitas_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "patrocinadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_ventaja_id_fkey"
            columns: ["ventaja_id"]
            isOneToOne: false
            referencedRelation: "ventajas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ajustes_club_publicos: {
        Row: {
          cuota_socio: number | null
          id: boolean | null
          nombre_club: string | null
          temporada_actual: string | null
          url_clasificacion_futgal: string | null
          url_twitch: string | null
          whatsapp_club: string | null
        }
        Insert: {
          cuota_socio?: number | null
          id?: boolean | null
          nombre_club?: string | null
          temporada_actual?: string | null
          url_clasificacion_futgal?: string | null
          url_twitch?: string | null
          whatsapp_club?: string | null
        }
        Update: {
          cuota_socio?: number | null
          id?: boolean | null
          nombre_club?: string | null
          temporada_actual?: string | null
          url_clasificacion_futgal?: string | null
          url_twitch?: string | null
          whatsapp_club?: string | null
        }
        Relationships: []
      }
      estadisticas_liga: {
        Row: {
          e: number | null
          g: number | null
          goles_contra: number | null
          goles_favor: number | null
          p: number | null
          pj: number | null
          puntos: number | null
          racha: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      acceder_como_negocio: { Args: { p_id: string }; Returns: undefined }
      acceso_password_club: { Args: { p_email: string }; Returns: Json }
      acceso_usuario_admin: { Args: { p_email: string }; Returns: Json }
      alta_socio_con_pago: {
        Args: { p_datos: Json; p_pago: Json }
        Returns: string
      }
      alta_socio_email: {
        Args: {
          p_email: string
          p_nombre: string
          p_solicitud?: string
          p_telefono?: string
        }
        Returns: string
      }
      anular_visita_prueba: { Args: { p_id: string }; Returns: undefined }
      asignar_directiva_email: {
        Args: { p_email: string; p_nombre: string }
        Returns: string
      }
      asignar_negocio_email: {
        Args: { p_email: string; p_id: string }
        Returns: undefined
      }
      borrar_visitas_prueba: { Args: { p_negocio: string }; Returns: undefined }
      completar_cambio_password: { Args: never; Returns: undefined }
      crear_negocio_email: {
        Args: {
          p_categoria: string
          p_condiciones: string
          p_descripcion: string
          p_direccion: string
          p_email: string
          p_importe?: number
          p_logo: string
          p_nombre: string
          p_titulo: string
        }
        Returns: string
      }
      crear_patrocinador: {
        Args: {
          p_categoria: string
          p_condiciones: string
          p_descripcion: string
          p_direccion: string
          p_importe?: number
          p_logo: string
          p_nombre: string
          p_pin: string
          p_titulo: string
        }
        Returns: string
      }
      crear_socio_desde_pago: {
        Args: { datos: Json; pago: Json }
        Returns: string
      }
      editar_socio_datos: {
        Args: {
          p_email: string
          p_id: string
          p_nombre: string
          p_telefono: string
        }
        Returns: undefined
      }
      editar_socio_ficha: {
        Args: {
          p_email: string
          p_id: string
          p_nombre: string
          p_numero: number
          p_telefono: string
        }
        Returns: undefined
      }
      elegir_vista: { Args: { p_role: string }; Returns: undefined }
      eliminar_socio_admin: {
        Args: { p_actor: string; p_nombre: string; p_socio: string }
        Returns: Json
      }
      enlazar_roles_email: { Args: never; Returns: Json }
      enlazar_socio: {
        Args: { p_dispositivo: string; p_token: string }
        Returns: string
      }
      entrar_negocio: { Args: { p_pin: string }; Returns: string }
      entregar_carnet_fisico: {
        Args: { p_entregado: boolean; p_socio: string }
        Returns: undefined
      }
      estado_acceso_personal: { Args: never; Returns: Json }
      estado_sesion_socia: { Args: never; Returns: string }
      gestion_socios: { Args: never; Returns: Json }
      gestionar_rol_persona: {
        Args: {
          p_activo: boolean
          p_email: string
          p_motivo?: string
          p_patrocinador?: string
          p_rol: Database["public"]["Enums"]["club_role"]
        }
        Returns: undefined
      }
      guardar_resultado_partido: {
        Args: {
          p_contra: number
          p_favor: number
          p_id: string
          p_posicion?: number
        }
        Returns: undefined
      }
      guardar_visita_prueba: {
        Args: {
          p_gasto?: string
          p_negocio: string
          p_origen?: string
          p_socio?: string
          p_tipo?: string
        }
        Returns: string
      }
      has_club_role: {
        Args: { r: Database["public"]["Enums"]["club_role"] }
        Returns: boolean
      }
      has_role: {
        Args: { r: Database["public"]["Enums"]["club_role"] }
        Returns: boolean
      }
      identificar_socio: { Args: { p_numero: number }; Returns: Json }
      is_directiva: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      marcar_apertura: { Args: never; Returns: undefined }
      mi_patrocinador: { Args: never; Returns: string }
      mi_socio: { Args: never; Returns: string }
      negocio_prueba_actual: { Args: never; Returns: string }
      password_alta_stripe: {
        Args: { p_accion: string; p_session: string }
        Returns: string
      }
      personas_club: { Args: never; Returns: Json }
      preparar_eliminar_socio: {
        Args: { p_nombre: string; p_socio: string }
        Returns: Json
      }
      preparar_password_usuario: { Args: { p_email: string }; Returns: string }
      procesar_alta_stripe: {
        Args: {
          p_event: string
          p_fecha: string
          p_importe: number
          p_metodo: string
          p_prueba: boolean
          p_referencia: string
          p_session: string
        }
        Returns: string
      }
      quitar_directiva: {
        Args: { p_motivo: string; p_user: string }
        Returns: undefined
      }
      registrar_pago_socio: {
        Args: { p_pago: Json; p_socio: string }
        Returns: string
      }
      registrar_password_usuario: {
        Args: {
          p_accion: string
          p_actor: string
          p_email: string
          p_usuario: string
        }
        Returns: undefined
      }
      reservar_directiva: {
        Args: { p_email: string; p_nombre: string; p_socio?: string }
        Returns: string
      }
      retirar_directiva_email: {
        Args: { p_id: string; p_motivo: string }
        Returns: undefined
      }
      salir_negocio_prueba: { Args: never; Returns: undefined }
      sesion_google: { Args: never; Returns: boolean }
      solicitar_alta: {
        Args: {
          p_consentimiento: boolean
          p_email: string
          p_mayor: boolean
          p_nombre: string
          p_telefono: string
        }
        Returns: string
      }
      stats_club: { Args: { p_periodo: string }; Returns: Json }
      stats_negocio_datos: {
        Args: {
          p_incluir_prueba: boolean
          p_patrocinador_id: string
          p_periodo: string
        }
        Returns: Json
      }
      stats_negocio_prueba: {
        Args: { p_patrocinador_id: string; p_periodo: string }
        Returns: Json
      }
      stats_patrocinador: {
        Args: { p_patrocinador_id: string; p_periodo: string }
        Returns: Json
      }
      stripe_auth_email: { Args: { p_email: string }; Returns: Json }
      transferir_super_admin: {
        Args: { nuevo_perfil_id: string }
        Returns: undefined
      }
      vincular_auth_stripe: {
        Args: { p_nuevo: boolean; p_session: string; p_user: string }
        Returns: undefined
      }
      vincular_directiva: {
        Args: { p_invitacion: string; p_user: string }
        Returns: undefined
      }
      visit_names_today: { Args: never; Returns: Json }
    }
    Enums: {
      club_role: "socia" | "negocio" | "directiva" | "super_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      club_role: ["socia", "negocio", "directiva", "super_admin"],
    },
  },
} as const
