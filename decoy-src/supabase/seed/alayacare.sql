create or replace function alayacare.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = alayacare, pg_temp
as $$
begin
  truncate table alayacare.care_team_member, alayacare.visit, alayacare.client restart identity cascade;
  alter sequence alayacare.client_id_seq restart with 100000;

  insert into alayacare.client (client_id, salutation, first_name, last_name, birthday, zip, phone_main, ai_agent_opt_out, channels_of_communication, types_of_communication, notification_recipient, contacts) values
    ('C0100001', 'Mrs', 'Margaret', 'Voss', '1938-03-14', '3220', '+61411300001', '', 'Phone Call', '', 'Client', '[]'),
    ('C0100002', 'Mr', 'Harold', 'Fenwick', '1941-11-02', '3350', '+61411300002', '', 'Phone Call', '', 'Client', '[]'),
    ('C0100003', 'Mrs', 'Ivy', 'Castellano', '1933-07-19', '3199', '+61411300003', '', 'SMS', '', 'Family Contact', '[]'),
    ('C0100004', 'Mr', 'Desmond', 'Okafor', '1945-01-27', '3630', '+61411300004', '', 'Phone Call', '', 'Client', '[]'),
    ('C0100005', 'Mrs', 'Lorna', 'Petrakis', '1937-09-08', '3550', '+61411300005', '', 'Email', '', 'Family Contact', '[]');

  insert into alayacare.visit (alayacare_service_id, employee_id, service_code_id, status, start_at, end_at, cancelled, client_id) values
    (610001, '051201', 43, 'scheduled', '2026-08-20T05:25:00+00:00', '2026-08-20T06:25:00+00:00', false, 'C0100001'),
    (610001, '051201', 43, 'completed', '2026-08-06T05:25:00+00:00', '2026-08-06T06:25:00+00:00', false, 'C0100001'),
    (610002, 'S0018842', 106, 'scheduled', '2026-08-22T22:00:00+00:00', '2026-08-23T00:30:00+00:00', false, 'C0100002'),
    (610003, '051340', 283, 'scheduled', '2026-08-19T22:00:00+00:00', '2026-08-19T22:15:00+00:00', false, 'C0100003'),
    (610003, '051340', 283, 'cancelled', '2026-08-12T22:00:00+00:00', '2026-08-12T22:15:00+00:00', true, 'C0100003'),
    (610004, 'S2201177', 327, 'scheduled', '2026-08-25T21:30:00+00:00', '2026-08-25T22:30:00+00:00', false, 'C0100004'),
    (610005, '051201', 43, 'missed', '2026-08-10T05:25:00+00:00', '2026-08-10T06:25:00+00:00', false, 'C0100005'),
    (610005, '051201', 43, 'scheduled', '2026-08-24T05:25:00+00:00', '2026-08-24T06:25:00+00:00', false, 'C0100005');

  insert into alayacare.care_team_member (client_id, employee_id, first_name, last_name, role, email) values
    ('C0100001', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example'),
    ('C0100001', '', 'Simone', 'Achebe', 'Team Leader', 'sachebe@agedcaredemo.example'),
    ('C0100002', 'S0018842', 'Priya', 'Dutta', 'Support Worker', 'pdutta@agedcaredemo.example'),
    ('C0100003', '051340', 'Owen', 'Marsh', 'Support Worker', 'omarsh@agedcaredemo.example'),
    ('C0100003', '', 'Simone', 'Achebe', 'Team Leader', 'sachebe@agedcaredemo.example'),
    ('C0100004', 'S2201177', 'Delphine', 'Roux', 'Support Worker', 'droux@agedcaredemo.example'),
    ('C0100005', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example');
end;
$$;

revoke execute on function alayacare.reset_demo_data() from public, anon, authenticated;
grant execute on function alayacare.reset_demo_data() to service_role;

select alayacare.reset_demo_data();
