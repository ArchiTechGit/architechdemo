create or replace function archicare.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = archicare, pg_temp
as $$
begin
  truncate table archicare.care_team_member, archicare.visit, archicare.client restart identity cascade;
  -- Seeded clients below use explicit literal client_id values (C0100001-C0100020) and
  -- never touch this sequence, so it must restart well above that range or the first
  -- auto-generated id (e.g. from a demo "New client" save) would collide/precede them.
  alter sequence archicare.client_id_seq restart with 200000;

  insert into archicare.client (client_id, salutation, first_name, last_name, birthday, zip, phone_main, ai_agent_opt_out, channels_of_communication, types_of_communication, notification_recipient, contacts, status, address_line, city, state, external_id, risks, services) values
    ('C0100001', 'Mrs', 'Margaret', 'Voss', '1938-03-14', '3220', '+61411300001', '', 'Phone Call', '', 'Client', '[]', 'Active', '14 Ryrie St', 'Geelong', 'VIC', '2088101', 'Fall history, Lives alone', array['Personal Support','Respite','Assessments']),
    ('C0100002', 'Mr', 'Harold', 'Fenwick', '1941-11-02', '3350', '+61411300002', '', 'Phone Call', '', 'Client', '[]', 'Active', '22 Sturt St', 'Ballarat', 'VIC', '2088102', 'Hoarder, Loose stair on the front steps', array['PSW Visits','Physiotherapy','Mentorship']),
    ('C0100003', 'Mrs', 'Ivy', 'Castellano', '1933-07-19', '3199', '+61411300003', '', 'SMS', '', 'Family Contact', '[]', 'Active', '8 Beach St', 'Frankston', 'VIC', '2088103', 'Dog on premises, Hearing impaired', array['Personal Support','Respiratory Services']),
    ('C0100004', 'Mr', 'Desmond', 'Okafor', '1945-01-27', '3630', '+61411300004', '', 'Phone Call', '', 'Client', '[]', 'Active', '5 Wyndham St', 'Shepparton', 'VIC', '2088104', 'Can be verbally abusive', array['PSW Visits','Assessments']),
    ('C0100005', 'Mrs', 'Lorna', 'Petrakis', '1937-09-08', '3550', '+61411300005', '', 'Email', '', 'Family Contact', '[]', 'Inactive', '31 Pall Mall', 'Bendigo', 'VIC', '2088105', 'Fall history', array['Respite','3 Hours - Personal & Advanced Care']),
    ('C0100006', 'Mrs', 'Beryl', 'Ashworth', '1936-05-11', '3280', '+61411300006', '', 'Phone Call', '', 'Client', '[]', 'Active', '12 Merri St', 'Warrnambool', 'VIC', '2088106', 'Diabetic, insulin dependent', array['Personal Support','Assessments']),
    ('C0100007', 'Mr', 'Colin', 'Merchant', '1940-02-23', '3844', '+61411300007', '', 'Phone Call', '', 'Client', '[]', 'Active', '4 Kay St', 'Traralgon', 'VIC', '2088107', 'Mobility aid required, uses walker', array['PSW Visits','Physiotherapy']),
    ('C0100008', 'Mrs', 'Noreen', 'Tran', '1943-08-30', '3500', '+61411300008', '', 'SMS', '', 'Family Contact', '[]', 'Active', '19 Deakin Ave', 'Mildura', 'VIC', '2088108', 'Vision impaired', array['Personal Support','Respite']),
    ('C0100009', 'Mr', 'Frank', 'Delacroix', '1939-12-04', '3875', '+61411300009', '', 'Phone Call', '', 'Client', '[]', 'Active', '7 Main St', 'Bairnsdale', 'VIC', '2088109', 'Fall history, lives alone', array['PSW Visits','Assessments','Mentorship']),
    ('C0100010', 'Mrs', 'Shirley', 'Kowalski', '1934-04-17', '3690', '+61411300010', '', 'Phone Call', '', 'Client', '[]', 'Inactive', '2 High St', 'Wodonga', 'VIC', '2088110', 'Cognitive decline, wandering risk', array['Personal Support','Respite','Respiratory Services']),
    ('C0100011', 'Mr', 'Reginald', 'Osei', '1942-10-09', '3250', '+61411300011', '', 'Phone Call', '', 'Client', '[]', 'Active', '15 Gellibrand St', 'Colac', 'VIC', '2088111', 'Hearing impaired', array['PSW Visits']),
    ('C0100012', 'Mrs', 'Dorothy', 'Vitale', '1938-06-26', '3400', '+61411300012', '', 'Email', '', 'Family Contact', '[]', 'Active', '9 Wilson St', 'Horsham', 'VIC', '2088112', 'Dog on premises', array['Respite','Assessments']),
    ('C0100013', 'Mr', 'Wallace', 'Ferreira', '1937-01-15', '3850', '+61411300013', '', 'Phone Call', '', 'Client', '[]', 'Active', '21 Raymond St', 'Sale', 'VIC', '2088113', 'Can be verbally abusive', array['PSW Visits','Mentorship']),
    ('C0100014', 'Mrs', 'Agnes', 'Bianchi', '1935-09-21', '3305', '+61411300014', '', 'SMS', '', 'Client', '[]', 'Active', '3 Julia St', 'Portland', 'VIC', '2088114', 'Fall history, loose rug in hallway', array['Personal Support','Physiotherapy']),
    ('C0100015', 'Mr', 'Bertram', 'Nakamura', '1944-03-03', '3377', '+61411300015', '', 'Phone Call', '', 'Client', '[]', 'Active', '6 Barkly St', 'Ararat', 'VIC', '2088115', 'Diabetic', array['PSW Visits','Assessments']),
    ('C0100016', 'Mrs', 'Winifred', 'Solomon', '1936-11-28', '3564', '+61411300016', '', 'Phone Call', '', 'Client', '[]', 'Inactive', '10 Hare St', 'Echuca', 'VIC', '2088116', 'Hoarder', array['Respite']),
    ('C0100017', 'Mr', 'Cyril', 'Adeyemi', '1941-07-07', '3677', '+61411300017', '', 'Phone Call', '', 'Client', '[]', 'Active', '18 Ovens St', 'Wangaratta', 'VIC', '2088117', 'Mobility aid required, uses wheelchair', array['Personal Support','Respiratory Services','Assessments']),
    ('C0100018', 'Mrs', 'Pearl', 'Grigoriou', '1939-04-12', '3429', '+61411300018', '', 'Email', '', 'Family Contact', '[]', 'Active', '25 Brook St', 'Sunbury', 'VIC', '2088118', 'Lives alone, fall history', array['PSW Visits','Respite']),
    ('C0100019', 'Mr', 'Sylvester', 'Pham', '1940-08-19', '3337', '+61411300019', '', 'Phone Call', '', 'Client', '[]', 'Active', '14 High St', 'Melton', 'VIC', '2088119', 'Cognitive decline', array['Personal Support','Mentorship']),
    ('C0100020', 'Mrs', 'Muriel', 'Kaczmarek', '1937-02-01', '3030', '+61411300020', '', 'Phone Call', '', 'Client', '[]', 'Active', '31 Watton St', 'Werribee', 'VIC', '2088120', 'Vision impaired, hearing impaired', array['Personal Support','Respite','Assessments']);

  insert into archicare.visit (alayacare_service_id, employee_id, service_code_id, status, start_at, end_at, cancelled, client_id) values
    (610001, '051201', 43, 'scheduled', '2026-08-20T05:25:00+00:00', '2026-08-20T06:25:00+00:00', false, 'C0100001'),
    (610001, '051201', 43, 'completed', '2026-08-06T05:25:00+00:00', '2026-08-06T06:25:00+00:00', false, 'C0100001'),
    (610002, 'S0018842', 106, 'scheduled', '2026-08-22T22:00:00+00:00', '2026-08-23T00:30:00+00:00', false, 'C0100002'),
    (610003, '051340', 283, 'scheduled', '2026-08-19T22:00:00+00:00', '2026-08-19T22:15:00+00:00', false, 'C0100003'),
    (610003, '051340', 283, 'cancelled', '2026-08-12T22:00:00+00:00', '2026-08-12T22:15:00+00:00', true, 'C0100003'),
    (610004, 'S2201177', 327, 'scheduled', '2026-08-25T21:30:00+00:00', '2026-08-25T22:30:00+00:00', false, 'C0100004'),
    (610005, '051201', 43, 'missed', '2026-08-10T05:25:00+00:00', '2026-08-10T06:25:00+00:00', false, 'C0100005'),
    (610005, '051201', 43, 'scheduled', '2026-08-24T05:25:00+00:00', '2026-08-24T06:25:00+00:00', false, 'C0100005'),
    (610006, '051201', 43, 'scheduled', '2026-08-21T04:00:00+00:00', '2026-08-21T05:00:00+00:00', false, 'C0100006'),
    (610007, '051340', 283, 'scheduled', '2026-08-21T23:00:00+00:00', '2026-08-22T00:00:00+00:00', false, 'C0100007'),
    (610007, '051340', 283, 'completed', '2026-08-07T23:00:00+00:00', '2026-08-08T00:00:00+00:00', false, 'C0100007'),
    (610008, 'S0018842', 106, 'scheduled', '2026-08-23T02:30:00+00:00', '2026-08-23T03:30:00+00:00', false, 'C0100008'),
    (610009, 'S2201177', 327, 'scheduled', '2026-08-26T05:00:00+00:00', '2026-08-26T06:00:00+00:00', false, 'C0100009'),
    (610009, 'S2201177', 327, 'cancelled', '2026-08-13T05:00:00+00:00', '2026-08-13T06:00:00+00:00', true, 'C0100009'),
    (610010, '051201', 43, 'missed', '2026-08-09T22:00:00+00:00', '2026-08-09T23:00:00+00:00', false, 'C0100010'),
    (610011, '051340', 283, 'scheduled', '2026-08-24T21:00:00+00:00', '2026-08-24T22:00:00+00:00', false, 'C0100011'),
    (610012, 'S0018842', 106, 'scheduled', '2026-08-25T03:00:00+00:00', '2026-08-25T04:00:00+00:00', false, 'C0100012'),
    (610013, '051201', 43, 'scheduled', '2026-08-22T05:30:00+00:00', '2026-08-22T06:30:00+00:00', false, 'C0100013'),
    (610014, 'S2201177', 327, 'completed', '2026-08-05T04:00:00+00:00', '2026-08-05T05:00:00+00:00', false, 'C0100014'),
    (610015, '051340', 283, 'scheduled', '2026-08-27T02:00:00+00:00', '2026-08-27T03:00:00+00:00', false, 'C0100015'),
    (610016, '051201', 43, 'missed', '2026-08-11T23:30:00+00:00', '2026-08-12T00:30:00+00:00', false, 'C0100016'),
    (610017, 'S0018842', 106, 'scheduled', '2026-08-23T22:30:00+00:00', '2026-08-23T23:30:00+00:00', false, 'C0100017'),
    (610018, 'S2201177', 327, 'scheduled', '2026-08-28T04:30:00+00:00', '2026-08-28T05:30:00+00:00', false, 'C0100018'),
    (610019, '051340', 283, 'completed', '2026-08-04T21:00:00+00:00', '2026-08-04T22:00:00+00:00', false, 'C0100019'),
    (610020, '051201', 43, 'scheduled', '2026-08-29T05:00:00+00:00', '2026-08-29T06:00:00+00:00', false, 'C0100020');

  insert into archicare.care_team_member (client_id, employee_id, first_name, last_name, role, email) values
    ('C0100001', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example'),
    ('C0100001', '', 'Simone', 'Achebe', 'Team Leader', 'sachebe@agedcaredemo.example'),
    ('C0100002', 'S0018842', 'Priya', 'Dutta', 'Support Worker', 'pdutta@agedcaredemo.example'),
    ('C0100003', '051340', 'Owen', 'Marsh', 'Support Worker', 'omarsh@agedcaredemo.example'),
    ('C0100003', '', 'Simone', 'Achebe', 'Team Leader', 'sachebe@agedcaredemo.example'),
    ('C0100004', 'S2201177', 'Delphine', 'Roux', 'Support Worker', 'droux@agedcaredemo.example'),
    ('C0100005', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example'),
    ('C0100006', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example'),
    ('C0100007', '051340', 'Owen', 'Marsh', 'Support Worker', 'omarsh@agedcaredemo.example'),
    ('C0100008', 'S0018842', 'Priya', 'Dutta', 'Support Worker', 'pdutta@agedcaredemo.example'),
    ('C0100009', 'S2201177', 'Delphine', 'Roux', 'Support Worker', 'droux@agedcaredemo.example'),
    ('C0100009', '', 'Simone', 'Achebe', 'Team Leader', 'sachebe@agedcaredemo.example'),
    ('C0100010', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example'),
    ('C0100011', '051340', 'Owen', 'Marsh', 'Support Worker', 'omarsh@agedcaredemo.example'),
    ('C0100012', 'S0018842', 'Priya', 'Dutta', 'Support Worker', 'pdutta@agedcaredemo.example'),
    ('C0100013', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example'),
    ('C0100014', 'S2201177', 'Delphine', 'Roux', 'Support Worker', 'droux@agedcaredemo.example'),
    ('C0100015', '051340', 'Owen', 'Marsh', 'Support Worker', 'omarsh@agedcaredemo.example'),
    ('C0100016', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example'),
    ('C0100017', 'S0018842', 'Priya', 'Dutta', 'Support Worker', 'pdutta@agedcaredemo.example'),
    ('C0100017', '', 'Simone', 'Achebe', 'Team Leader', 'sachebe@agedcaredemo.example'),
    ('C0100018', 'S2201177', 'Delphine', 'Roux', 'Support Worker', 'droux@agedcaredemo.example'),
    ('C0100019', '051340', 'Owen', 'Marsh', 'Support Worker', 'omarsh@agedcaredemo.example'),
    ('C0100020', '051201', 'Nathan', 'Brice', 'Support Worker', 'nbrice@agedcaredemo.example');
end;
$$;

revoke execute on function archicare.reset_demo_data() from public, anon, authenticated;
grant execute on function archicare.reset_demo_data() to service_role;

select archicare.reset_demo_data();
