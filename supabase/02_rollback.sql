-- =====================================================================
-- NEMAA rollback: يعيد السياسات والصلاحيات إلى ما كانت عليه قبل 01_migration.sql حرفياً.
-- (الجداول والدوال الجديدة تبقى دون ضرر. لا تُحذف بيانات.)
-- تنبيه: بعد التراجع تعود الثغرات القديمة (كل زائر يكتب ويحذف)، فاستخدمه للطوارئ فقط.
-- =====================================================================
begin;

do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
           where schemaname = 'public' and tablename in ('blessings', 'reports', 'feedback', 'admin_deleted_blessings')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

drop trigger if exists trg_sync_hidden   on public.admin_deleted_blessings;
drop trigger if exists trg_guard_reports on public.reports;
drop trigger if exists trg_guard_feedback on public.feedback;

grant insert, update, delete, truncate on public.blessings to anon, authenticated;
grant update, delete, truncate         on public.reports   to anon;
grant select, update, delete, truncate on public.feedback  to anon;
grant all                              on public.admin_deleted_blessings to anon;

create policy "السماح للجميع بقراءة النعم" on public.blessings for select to public using (true);
create policy "السماح للجميع بنشر النعم" on public.blessings for insert to public with check (true);
create policy "Allow public read" on public.blessings for select to public using (true);
create policy "Allow public insert" on public.blessings for insert to public with check (true);
create policy "Allow authenticated delete" on public.blessings for delete to authenticated using (true);
create policy "Allow delete for all" on public.blessings for delete to anon, authenticated using (true);
create policy "Allow update for all" on public.blessings for update to anon, authenticated using (true);
create policy "blessings_all_access" on public.blessings for all to anon, authenticated using (true) with check (true);
create policy "Allow anon and auth to insert reports" on public.reports for insert to anon, authenticated with check (true);
create policy "Allow read reports for all" on public.reports for select to anon, authenticated using (true);
create policy "Allow delete reports for all" on public.reports for delete to anon, authenticated using (true);
create policy "Allow update reports for all" on public.reports for update to anon, authenticated using (true);
create policy "Allow select admin_deleted_blessings" on public.admin_deleted_blessings for select to anon, authenticated using (true);
create policy "Allow insert admin_deleted_blessings" on public.admin_deleted_blessings for insert to anon, authenticated with check (true);
create policy "Allow delete admin_deleted_blessings" on public.admin_deleted_blessings for delete to anon, authenticated using (true);
create policy "feedback_all_access" on public.feedback for all to anon, authenticated using (true) with check (true);

commit;
