import { supabase } from '../lib/supabaseClient';

export async function addDailyLog(payload: {
  log_date: string;
  energy?: number;
  mood?: number;
  sleep_hours?: number;
  notes?: string;
  symptoms?: { key: string; severity: number }[];
}) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('daily_logs')
    .insert([{ user_id: user.id, ...payload }])
    .select()
    .single();
  if (error) throw error;

  if (payload.symptoms?.length) {
    const rows = payload.symptoms.map(s => ({
      log_id: data.id,
      symptom_key: s.key,
      severity: s.severity
    }));
    const { error: e2 } = await supabase.from('log_symptoms').insert(rows);
    if (e2) throw e2;
  }
  return data;
}

export async function getLogs(rangeDays = 30) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date(Date.now() - rangeDays * 86400000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from('daily_logs')
    .select('id, log_date, energy, mood, sleep_hours, notes, log_symptoms (symptom_key, severity)')
    .gte('log_date', since)
    .order('log_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}