-- =====================================================================
-- 03_fix_rename_praise.sql  —  إصلاح: عدّاد الحمد يتصفّر عند تغيير عنوان النعمة
-- يغيّر دالة واحدة فقط (update_blessing). لا يمسّ الجداول ولا السياسات ولا البيانات.
-- آمن لإعادة التشغيل. للتراجع: شغّل 03_rollback_rename_praise.sql
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
  v_moved text;
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

  -- العنوان هو المفتاح الأساسي. عدّادات الحمد والبلاغات تُخزَّن بالعنوان دون مفتاح أجنبي،
  -- فإن تغيّر العنوان تنتقل معه وإلا يتصفّر العدّاد ويتيتّم.
  if v_row.title is distinct from p_old_title then
    -- نفس قفل increment_praise وبترتيب ثابت للعنوانين حتى لا نتقاطع مع ضغطة حمد جارية ولا يحدث deadlock
    perform pg_advisory_xact_lock(hashtext('praise:' || least(p_old_title, v_row.title)));
    perform pg_advisory_xact_lock(hashtext('praise:' || greatest(p_old_title, v_row.title)));

    select notes into v_moved from public.reports
     where reason = 'praise_sync' and blessing_title = p_old_title;
    if found then
      delete from public.reports where reason = 'praise_sync' and blessing_title = p_old_title;
      insert into public.reports (id, blessing_title, reason, notes, status, created_at)
      values ('praise_' || substr(md5(v_row.title), 1, 12), v_row.title, 'praise_sync',
              (case when v_moved ~ '^[0-9]+$' then v_moved::bigint else 0 end)::text, 'praise', now())
      on conflict (id) do update set
        reason = 'praise_sync', status = 'praise', blessing_title = excluded.blessing_title,
        notes = ((case when public.reports.notes ~ '^[0-9]+$' and public.reports.reason = 'praise_sync'
                       then public.reports.notes::bigint else 0 end) + excluded.notes::bigint)::text;
    end if;
    -- بلاغات الزوّار على النعمة تتبع عنوانها الجديد أيضاً
    update public.reports set blessing_title = v_row.title
     where blessing_title = p_old_title and reason <> 'praise_sync';
  end if;

  return to_jsonb(v_row);
end $$;

-- يطلب من PostgREST إعادة قراءة المخطط
notify pgrst, 'reload schema';

commit;
