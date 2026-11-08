-- =====================================================================
-- NEMAA security migration  (ملف الترحيل الأمني لمشروع نعمة)
--
-- قبل التشغيل:  غيّر البريد في السطر المعلَّم  >>> ADMIN EMAIL <<<  إلى بريد حساب
--               المدير المسجَّل في Supabase (Authentication > Users).
--               إن لم يوجد الحساب أو بقي النص كما هو، يتوقف الملف كله ولا يتغير شيء.
--
-- ما يفعله:
--   1) ينشئ جدول المديرين ودالة is_admin() ليكون "المدير" مُحدَّداً في قاعدة البيانات.
--   2) يُغلق الكتابة المباشرة على blessings: النشر والتعديل والحذف عبر دوال تتحقق
--      من رمز الملكية (أو من كون المستخدم مديراً).
--   3) يُقفل reports وfeedback وadmin_deleted_blessings: الزائر يضيف فقط، والمدير يدير.
--   4) ينشئ notifications لإشعارات المدير للمؤلفين (لا يقرؤها إلا صاحبها).
--   5) ينشئ hidden_blessings: قائمة عامة بالنعم المخفية دون كشف الأرشيف الكامل.
--
-- يُشغَّل مرة واحدة داخل transaction. للتراجع: 02_rollback.sql
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- -1. فحص مسبق: الدوال الجديدة تعمل بصلاحيات مُنفِّذ هذا الملف، فيجب أن يملك الجداول
--     (أو يتجاوز RLS). وإلا ستفشل الكتابة عبر الدوال بصمت. عند الفشل لا يتغير شيء.
-- ---------------------------------------------------------------------
do $$
declare t text; v_owner name; v_bypass boolean;
begin
  select (rolsuper or rolbypassrls) into v_bypass from pg_roles where rolname = current_user;
  foreach t in array array['blessings', 'reports', 'feedback', 'admin_deleted_blessings'] loop
    select tableowner into v_owner from pg_tables where schemaname = 'public' and tablename = t;
    if v_owner is null then
      raise exception 'الجدول public.% غير موجود: هذا ليس مشروع نعمة المتوقع', t;
    end if;
    if v_owner <> current_user and not coalesce(v_bypass, false) then
      raise exception 'الجدول public.% يملكه % ولا يملكه المُنفِّذ الحالي (%). شغّل الملف من SQL Editor بحساب postgres.', t, v_owner, current_user;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 0. المديرون
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

do $$
declare
  v_admin_email text := 'PUT_ADMIN_EMAIL_HERE';   -- >>> ADMIN EMAIL <<<
  v_uid uuid;
begin
  if v_admin_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'ضع بريد المدير في السطر المعلَّم ADMIN EMAIL ثم أعد التشغيل';
  end if;
  select id into v_uid from auth.users where lower(email) = lower(v_admin_email);
  if v_uid is null then
    raise exception 'لا يوجد مستخدم بالبريد % في Authentication > Users. أنشئ الحساب أولاً.', v_admin_email;
  end if;
  insert into public.admins (user_id, email) values (v_uid, v_admin_email)
  on conflict (user_id) do nothing;
end $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.nm_hash(p text) returns text
language sql immutable set search_path = pg_catalog as $$
  select encode(sha256(convert_to(p, 'UTF8')), 'hex');
$$;
revoke all on function public.nm_hash(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 1. جداول جديدة
-- ---------------------------------------------------------------------
-- ملكية النعمة: نخزّن بصمة الرمز السري فقط، في جدول لا يقرؤه أحد مباشرة.
create table if not exists public.blessing_owners (
  title      text primary key references public.blessings(title) on update cascade on delete cascade,
  owner_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists blessing_owners_hash_idx on public.blessing_owners (owner_hash);
alter table public.blessing_owners enable row level security;
revoke all on public.blessing_owners from anon, authenticated;

-- قائمة عامة بالنعم المخفية (معرّف وعنوان فقط) تُغذّى تلقائياً من الأرشيف.
create table if not exists public.hidden_blessings (
  id             text primary key,
  blessing_title text,
  created_at     timestamptz not null default now()
);
alter table public.hidden_blessings enable row level security;
alter table public.hidden_blessings replica identity full;
insert into public.hidden_blessings (id, blessing_title, created_at)
  select id, blessing_title, coalesce(created_at, now()) from public.admin_deleted_blessings
  on conflict (id) do nothing;

-- إشعارات المدير للمؤلفين والمُبلّغين، موجّهة ببصمة رمز المستلم.
create table if not exists public.notifications (
  id             text primary key,
  target_hash    text not null,
  kind           text not null check (kind in ('author_notification', 'reporter_inquiry')),
  blessing_id    text,
  blessing_title text,
  message        text not null check (char_length(message) between 1 and 2000),
  action_type    text,
  admin_label    text,
  author_name    text,
  created_at     timestamptz not null default now()
);
create index if not exists notifications_target_idx on public.notifications (target_hash);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon;

-- نسخة المستخدم الاحتياطية (رموز الملكية + قائمة نعمه المنشورة).
-- كانت تُحفظ داخل user_metadata فتتضخم داخل كل JWT يُرسل مع كل طلب حتى تتجاوز حد رؤوس HTTP.
-- هنا: صف واحد لكل مستخدم، لا يقرؤه ولا يكتبه غيره (RLS)، وبحدود أحجام.
create table if not exists public.user_backup (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  owner_tokens jsonb not null default '[]'::jsonb,
  my_blessings jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now(),
  constraint user_backup_tokens_chk
    check (jsonb_typeof(owner_tokens) = 'array' and jsonb_array_length(owner_tokens) <= 100),
  constraint user_backup_blessings_chk
    check (jsonb_typeof(my_blessings) = 'array' and jsonb_array_length(my_blessings) <= 300
           and octet_length(my_blessings::text) <= 1000000)
);
alter table public.user_backup enable row level security;
revoke all on public.user_backup from anon, authenticated;
grant select, insert, update on public.user_backup to authenticated;

-- فهارس تُسرّع فحوص الإغراق وعدّاد الحمد (آمنة لإعادة التشغيل)
create index if not exists blessings_created_at_idx on public.blessings (created_at);
create index if not exists reports_created_at_idx   on public.reports (created_at);
create index if not exists feedback_created_at_idx  on public.feedback (created_at);
create index if not exists reports_praise_idx       on public.reports (blessing_title) where reason = 'praise_sync';

-- ---------------------------------------------------------------------
-- 2. حذف كل السياسات القديمة المفتوحة وبناء السياسات الجديدة
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('blessings', 'reports', 'feedback', 'admin_deleted_blessings', 'hidden_blessings', 'notifications', 'user_backup')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.blessings               enable row level security;
alter table public.reports                 enable row level security;
alter table public.feedback                enable row level security;
alter table public.admin_deleted_blessings enable row level security;

-- blessings: قراءة للجميع. لا توجد أي سياسة كتابة (الكتابة عبر الدوال فقط).
create policy blessings_read on public.blessings
  for select to anon, authenticated using (true);
-- حزام أمان إضافي: حتى لو أُضيفت سياسة مفتوحة بالخطأ لاحقاً، لا تملك الأدوار العامة صلاحية الكتابة.
revoke insert, update, delete, truncate on public.blessings from anon, authenticated;

-- reports: قراءة صفوف الحمد والإعلانات العامة فقط. الزائر يضيف بلاغاً عادياً فقط. المدير كل شيء.
create policy reports_public_read on public.reports
  for select to anon, authenticated
  using (reason in ('praise_sync', 'admin_global_broadcast'));
create policy reports_public_insert on public.reports
  for insert to anon, authenticated
  with check (
    reason is not null
    and reason not in ('praise_sync', 'admin_author_notification', 'admin_reporter_inquiry', 'admin_global_broadcast')
    and coalesce(status, 'pending') = 'pending'
    and char_length(id) <= 100
    and char_length(coalesce(reason, '')) <= 200
    and char_length(coalesce(blessing_id, '')) <= 200
    and char_length(coalesce(blessing_title, '')) <= 300
    and char_length(coalesce(notes, '')) <= 4000
  );
create policy reports_admin_all on public.reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke update, delete, truncate on public.reports from anon;

-- feedback: الزائر يضيف فقط ولا يقرأ. المدير كل شيء.
create policy feedback_public_insert on public.feedback
  for insert to anon, authenticated
  with check (
    coalesce(status, 'pending') = 'pending'
    and admin_notes is null
    and coalesce(type, 'suggestion') in ('suggestion', 'complaint', 'other')
    and char_length(id) <= 100
    and char_length(coalesce(title, '')) <= 300
    and char_length(coalesce(content, '')) <= 4000
    and char_length(coalesce(user_name, '')) <= 100
    and char_length(coalesce(contact, '')) <= 300
  );
create policy feedback_admin_all on public.feedback
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke select, update, delete, truncate on public.feedback from anon;

-- admin_deleted_blessings: أرشيف كامل للمدير فقط.
create policy adb_admin_all on public.admin_deleted_blessings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.admin_deleted_blessings from anon;

-- hidden_blessings: قراءة عامة، والكتابة عبر المُشغِّل فقط.
create policy hidden_read on public.hidden_blessings
  for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.hidden_blessings from anon, authenticated;

-- notifications: المدير فقط مباشرة. المستخدمون عبر الدوال.
create policy notifications_admin_all on public.notifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_backup: كل مستخدم يرى ويكتب صفّه فقط.
create policy user_backup_own on public.user_backup
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. المُشغِّلات
-- ---------------------------------------------------------------------
-- مزامنة قائمة المخفي العامة مع أرشيف المدير.
create or replace function public.sync_hidden_blessings() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into public.hidden_blessings (id, blessing_title)
    values (new.id, new.blessing_title)
    on conflict (id) do update set blessing_title = excluded.blessing_title;
    return new;
  elsif tg_op = 'DELETE' then
    delete from public.hidden_blessings where id = old.id;
    return old;
  end if;
  return null;
end $$;
revoke all on function public.sync_hidden_blessings() from public, anon, authenticated;
drop trigger if exists trg_sync_hidden on public.admin_deleted_blessings;
create trigger trg_sync_hidden after insert or delete on public.admin_deleted_blessings
  for each row execute function public.sync_hidden_blessings();

-- حماية من الإغراق: الوقت يُحدَّد من الخادم، وحد أقصى للإضافات في الدقيقة (للزوار فقط).
create or replace function public.guard_reports_insert() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.is_admin()
     or new.reason in ('praise_sync', 'admin_author_notification', 'admin_reporter_inquiry', 'admin_global_broadcast') then
    return new;
  end if;
  new.created_at := now();
  if (select count(*) from public.reports
        where created_at > now() - interval '1 minute'
          and reason not in ('praise_sync', 'admin_author_notification', 'admin_reporter_inquiry', 'admin_global_broadcast')) >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.guard_reports_insert() from public, anon, authenticated;
drop trigger if exists trg_guard_reports on public.reports;
create trigger trg_guard_reports before insert on public.reports
  for each row execute function public.guard_reports_insert();

create or replace function public.guard_feedback_insert() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.is_admin() then return new; end if;
  new.created_at := now();
  new.updated_at := null;
  if (select count(*) from public.feedback where created_at > now() - interval '1 minute') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.guard_feedback_insert() from public, anon, authenticated;
drop trigger if exists trg_guard_feedback on public.feedback;
create trigger trg_guard_feedback before insert on public.feedback
  for each row execute function public.guard_feedback_insert();

-- ---------------------------------------------------------------------
-- 4. دوال النعم
-- ---------------------------------------------------------------------
create or replace function public.publish_blessing(
  p_title text, p_reflection text, p_author text, p_proof text, p_proof_source text, p_token text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_ref   text := btrim(coalesce(p_reflection, ''));
  v_row   public.blessings;
  -- المدير فقط يستطيع النشر بلا مالك (استعادة نعمة من الأرشيف)
  v_ownerless boolean := (p_token is null and public.is_admin());
begin
  if char_length(v_title) < 1 or char_length(v_title) > 120 then raise exception 'invalid_title' using errcode = 'P0001'; end if;
  if char_length(v_ref) < 1 or char_length(v_ref) > 2000 then raise exception 'invalid_reflection' using errcode = 'P0001'; end if;
  if char_length(coalesce(p_author, '')) > 100 or char_length(coalesce(p_proof, '')) > 1000
     or char_length(coalesce(p_proof_source, '')) > 200 then
    raise exception 'invalid_input' using errcode = 'P0001';
  end if;
  if not v_ownerless and (p_token is null or char_length(p_token) < 16 or char_length(p_token) > 128) then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  if (select count(*) from public.blessings where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.blessings (title, reflection, author, proof, proof_source)
  values (v_title, v_ref, nullif(btrim(coalesce(p_author, '')), ''),
          nullif(btrim(coalesce(p_proof, '')), ''), nullif(btrim(coalesce(p_proof_source, '')), ''))
  returning * into v_row;

  if not v_ownerless then
    insert into public.blessing_owners (title, owner_hash) values (v_row.title, public.nm_hash(p_token));
  end if;
  return to_jsonb(v_row);
end $$;

-- يتحقق: مدير، أو أحد الرموز المرسلة يطابق بصمة مالك النعمة.
create or replace function public.can_manage_blessing(p_title text, p_tokens text[]) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_admin() or exists (
    select 1 from public.blessing_owners o
    where o.title = p_title
      and o.owner_hash in (select public.nm_hash(t) from unnest((coalesce(p_tokens, '{}'::text[]))[1:100]) as t)
  );
$$;
revoke all on function public.can_manage_blessing(text, text[]) from public, anon, authenticated;

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

create or replace function public.delete_blessing(p_title text, p_tokens text[]) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.blessings where title = p_title) then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if not public.can_manage_blessing(p_title, p_tokens) then
    raise exception 'not_authorized' using errcode = 'P0001';
  end if;
  delete from public.blessings where title = p_title;
  return true;
end $$;

-- عدّاد الحمد: زيادة ذرّية على الخادم بدل أن يرسل المتصفح الرقم.
create or replace function public.increment_praise(p_title text) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_count bigint;
begin
  if char_length(v_title) < 1 or char_length(v_title) > 300 then raise exception 'invalid_title' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext('praise:' || v_title));

  update public.reports
     set notes = ((case when notes ~ '^[0-9]+$' then notes::bigint else 0 end) + 1)::text
   where reason = 'praise_sync' and blessing_title = v_title
  returning notes::bigint into v_count;
  if v_count is not null then return v_count; end if;

  if (select count(*) from public.reports where reason = 'praise_sync') >= 3000 then
    -- عند الامتلاء لا نوقف العدّ للأبد (كان يكفي مُغرِق بعناوين وهمية): نُخلي أقدم عدّاد صغير (1 أو 2) ونكمل.
    delete from public.reports
     where id = (select id from public.reports
                  where reason = 'praise_sync' and notes in ('1', '2')
                  order by created_at asc limit 1);
    if not found then
      raise exception 'too_many_titles' using errcode = 'P0001';
    end if;
  end if;
  insert into public.reports (id, blessing_title, reason, notes, status, created_at)
  values ('praise_' || substr(md5(v_title), 1, 12), v_title, 'praise_sync', '1', 'praise', now())
  on conflict (id) do update set
    reason = 'praise_sync', status = 'praise', blessing_title = excluded.blessing_title,
    notes = ((case when public.reports.notes ~ '^[0-9]+$' and public.reports.reason = 'praise_sync' then public.reports.notes::bigint else 0 end) + 1)::text
  returning notes::bigint into v_count;
  return v_count;
end $$;

-- ---------------------------------------------------------------------
-- 5. دوال الإشعارات
-- ---------------------------------------------------------------------
create or replace function public.get_my_notifications(p_tokens text[])
returns table (id text, kind text, blessing_id text, blessing_title text, message text,
               action_type text, admin_label text, author_name text, created_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select n.id, n.kind, n.blessing_id, n.blessing_title, n.message, n.action_type, n.admin_label, n.author_name, n.created_at
  from public.notifications n
  where n.target_hash in (select public.nm_hash(t) from unnest((coalesce(p_tokens, '{}'::text[]))[1:200]) as t)
  order by n.created_at desc
  limit 100;
$$;

create or replace function public.dismiss_my_notification(p_id text, p_tokens text[]) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int;
begin
  delete from public.notifications n
   where n.id = p_id
     and n.target_hash in (select public.nm_hash(t) from unnest((coalesce(p_tokens, '{}'::text[]))[1:200]) as t);
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

create or replace function public.admin_send_notification(
  p_kind text, p_blessing_title text, p_target_token text, p_message text,
  p_action_type text, p_admin_label text, p_blessing_id text, p_author text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_target text;
  v_id text := 'notif_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = 'P0001'; end if;
  if p_kind = 'author_notification' then
    select o.owner_hash into v_target from public.blessing_owners o where o.title = p_blessing_title;
    if v_target is null then raise exception 'no_owner' using errcode = 'P0001'; end if;
  elsif p_kind = 'reporter_inquiry' then
    if p_target_token is null or btrim(p_target_token) = '' then raise exception 'no_target' using errcode = 'P0001'; end if;
    v_target := public.nm_hash(p_target_token);
  else
    raise exception 'invalid_kind' using errcode = 'P0001';
  end if;
  insert into public.notifications (id, target_hash, kind, blessing_id, blessing_title, message, action_type, admin_label, author_name)
  values (v_id, v_target, p_kind, p_blessing_id, p_blessing_title, btrim(coalesce(p_message, '')), p_action_type, p_admin_label, p_author);
  return jsonb_build_object('id', v_id);
end $$;

-- ---------------------------------------------------------------------
-- 6. صلاحيات تنفيذ الدوال: العامة فقط ما يحتاجه التطبيق
-- ---------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'publish_blessing(text,text,text,text,text,text)',
    'update_blessing(text,text[],text,text,text,text,text)',
    'delete_blessing(text,text[])',
    'increment_praise(text)',
    'get_my_notifications(text[])',
    'dismiss_my_notification(text,text[])',
    'admin_send_notification(text,text,text,text,text,text,text,text)'
  ] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. التحديث اللحظي: نضيف قائمة المخفي العامة
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hidden_blessings') then
    alter publication supabase_realtime add table public.hidden_blessings;
  end if;
end $$;

-- يطلب من PostgREST إعادة قراءة المخطط فوراً ليرى الدوال الجديدة (يُسلَّم عند commit)
notify pgrst, 'reload schema';

commit;

-- ملخص بعد التنفيذ (للقراءة فقط)
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by tablename, policyname;
