import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { lecturaSchema } from './pieza-resultado';

const PROMPT = `Esta imagen es una pieza de resultado de un partido de fútbol sala del R.U. Lucense (también "Concello de Guntín - R.U. Lucense"). Lee el marcador y, solo para jugadores del R.U. Lucense, goleadores con su número de goles, asistentes con su número de asistencias y tarjetas amarillas y rojas. Responde SOLO con JSON con esta forma: {"golesRul": número o null, "golesRival": número o null, "jugadores": [{"nombre": "texto tal cual aparece", "goles": 0, "asistencias": 0, "amarillas": 0, "rojas": 0}]}. Una entrada por jugador. No inventes datos que no se vean.`;

async function leerImagenIA(supabase: { storage: { from: (b: string) => { download: (p: string) => Promise<{ data: Blob | null; error: unknown }> } } }, bucket: string, path: string, prompt: string) {
  const file = await supabase.storage.from(bucket).download(path);
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
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'file', mediaType: tipo, data: btoa(bin) }] }],
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: 'low', reasoningSummary: 'auto', store: false, include: ['reasoning.encrypted_content'] } },
    });
    texto = await result.text;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    console.error('leerImagenIA', status, e instanceof Error ? e.message : e);
    throw new Error(status === 402 ? 'No quedan créditos de IA en el espacio de trabajo.' : status === 429 ? 'La IA está ocupada; prueba en un minuto.' : 'La IA no pudo leer la imagen.');
  }
  try { return JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)) as unknown; } catch { return null; }
}
async function exigirDirectiva(supabase: { rpc: (f: 'has_club_role', a: { r: 'directiva' }) => PromiseLike<{ data: unknown; error: unknown }> }) {
  const perm = await supabase.rpc('has_club_role', { r: 'directiva' });
  if (perm.error || perm.data !== true) throw new Error('Solo la directiva puede leer piezas.');
}

export const leerPiezaResultado = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ path: z.string().min(1).max(300) }).parse(v))
  .handler(async ({ data, context }) => {
    await exigirDirectiva(context.supabase);
    const parsed = lecturaSchema.safeParse(await leerImagenIA(context.supabase, 'piezas-resultado', data.path, PROMPT));
    if (!parsed.success) throw new Error('No se pudo interpretar la imagen. Rellena los contadores a mano.');
    return parsed.data;
  });

const PROMPT_CONVOCATORIA = 'Esta imagen es la convocatoria de un partido de fútbol sala del R.U. Lucense. Lista los nombres o apodos de los jugadores convocados tal como aparecen, en el orden de la imagen. Responde SOLO con JSON: {"nombres": ["..."]}. No inventes nombres.';
export const leerPiezaConvocatoria = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ path: z.string().min(1).max(300) }).parse(v))
  .handler(async ({ data, context }) => {
    await exigirDirectiva(context.supabase);
    const parsed = z.object({ nombres: z.array(z.string()) }).safeParse(await leerImagenIA(context.supabase, 'piezas-convocatoria', data.path, PROMPT_CONVOCATORIA));
    if (!parsed.success) throw new Error('No se pudo interpretar la imagen. Marca los convocados a mano.');
    return parsed.data;
  });
