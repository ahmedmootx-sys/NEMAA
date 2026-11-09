-- =====================================================================
-- 03_rollback_rename_praise.sql  —  يعيد update_blessing إلى تعريفها قبل الإصلاح (بدون نقل العدّاد عند تغيير العنوان)
-- =====================================================================
begin;

create or replace function public.update_blessing(
  p_old_title text, p_tokens text[], p_title text, p_reflection text, p_author text, p_proof text, p_proof_source text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_ref   text := btrim(coalesce(p_reflection, ''));
  v_row   public.blessings;
begin
  if not exists (select 1 from public.blessings where title = p_old_title) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if not public.can_manage_blessing(p_old_title, p_tokens) then
    raise exception 'not_authorized' using errcode = 'P0001';
  end if;
  if char_length(v_title) < 1 or char_length(v_title) > 120 then raise exception 'invalid_title' using errcode = 'P0001'; end if;
  if char_length(v_ref) < 1 or char_length(v_ref) > 2000 then raise exception 'invalid_reflection' using errcode = 'P0001'; end if;
  if char_length(coalesce(p_author, '')) > 100 or char_length(coalesce(p_proof, '')) > 1000
     or char_length(coalesce(p_proof_source, '')) > 200 then
    raise exception 'invalid_input' using errcode = 'P0001';
  end if;

  update public.blessings set
    title = v_title,
    reflection = v_ref,
    author = nullif(btrim(coalesce(p_author, '')), ''),
    proof = nullif(btrim(coalesce(p_proof, '')), ''),
    proof_source = nullif(btrim(coalesce(p_proof_source, '')), '')
  where title = p_old_title
  returning * into v_row;

  return to_jsonb(v_row);
end $$;

-- يطلب من PostgREST إعادة قراءة المخطط
notify pgrst, 'reload schema';

commit;
