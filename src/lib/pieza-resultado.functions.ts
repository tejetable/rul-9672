import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { lecturaSchema } from './pieza-resultado';

const PROMPT = `Esta imagen es una pieza de resultado de un partido de fútbol sala del R.U. Lucense (también "Concello de Guntín - R.U. Lucense"). Lee el marcador y, solo para jugadores del R.U. Lucense, goleadores con su número de goles, asistentes con su número de asistencias y tarjetas amarillas y rojas. Responde SOLO con JSON con esta forma: {"golesRul": número o null, "golesRival": número o null, "jugadores": [{"nombre": "texto tal cual aparece", "goles": 0, "asistencias": 0, "amarillas": 0, "rojas": 0}]}. Una entrada por jugador. No inventes datos que no se vean.`;

export const leerPiezaResultado = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ path: z.string().min(1).max(300) }).parse(v))
  .handler(async ({ data, context }) => {
    const perm = await context.supabase.rpc('has_club_role', { r: 'directiva' });
    if (perm.error || perm.data !== true) throw new Error('Solo la directiva puede leer piezas de resultado.');
    const file = await context.supabase.storage.from('piezas-resultado').download(data.path);
    if (file.error || !file.data) throw new Error('No se pudo abrir la imagen subida.');
    const tipo = file.data.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const bytes = new Uint8Array(await file.data.arrayBuffer());
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) throw new Error('Falta configurar la IA del proyecto.');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { streamText } = await import('ai');
    const provider = createOpenAI({ baseURL: 'https://ai.gateway.lovable.dev/v1', apiKey, headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' } });
    let texto = '';
    try {
      const result = streamText({
        model: provider.responses('openai/gpt-6-astra'),
        maxRetries: 0,
        messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'file', mediaType: tipo, data: btoa(bin) }] }],
        providerOptions: { openai: { forceReasoning: true, reasoningEffort: 'low', reasoningSummary: 'auto', store: false, include: ['reasoning.encrypted_content'] } },
      });
      texto = await result.text;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error('leerPiezaResultado', status, e instanceof Error ? e.message : e);
      throw new Error(status === 402 ? 'No quedan créditos de IA en el espacio de trabajo.' : status === 429 ? 'La IA está ocupada; prueba en un minuto.' : 'La IA no pudo leer la imagen.');
    }
    const json = texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1);
    const parsed = lecturaSchema.safeParse((() => { try { return JSON.parse(json); } catch { return null; } })());
    if (!parsed.success) throw new Error('No se pudo interpretar la imagen. Rellena los contadores a mano.');
    return parsed.data;
  });
