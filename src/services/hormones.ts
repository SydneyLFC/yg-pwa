import supabase from '../lib/tempSupabaseClient';

export async function addHormoneResult(payload: {
  result_date: string;
  estradiol_pg_ml?: number;
  fsh_mIU_ml?: number;
  lh_mIU_ml?: number;
  progesterone_ng_ml?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('hormone_results')
    .insert([{ user_id: user.id, ...payload }]);

  if (error) throw error;
}