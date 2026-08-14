create or replace function dynamics.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = dynamics, pg_temp
as $$
begin
  truncate table dynamics.annotation, dynamics.opportunity, dynamics.contact, dynamics.lead, dynamics.account restart identity cascade;

  insert into dynamics.account (accountid, name, telephone1, websiteurl, address1_line1, address1_city, address1_stateorprovince, address1_postalcode, address1_country, industrycode) values
    ('11111111-1111-1111-1111-111111111111', 'Northwind Health', '02 9000 1111', 'northwindhealth.example', '1 Flinders St', 'Melbourne', 'VIC', '3000', 'Australia', 'Healthcare'),
    ('11111111-1111-1111-1111-111111111112', 'Contoso Aged Care', '02 9000 1112', 'contosoagedcare.example', '22 George St', 'Sydney', 'NSW', '2000', 'Australia', 'Aged Care'),
    ('11111111-1111-1111-1111-111111111113', 'Fabrikam Retail', '02 9000 1113', 'fabrikamretail.example', '5 Queen St', 'Brisbane', 'QLD', '4000', 'Australia', 'Retail');

  insert into dynamics.contact (contactid, parentcustomerid, firstname, lastname, jobtitle, emailaddress1, emailaddress2, telephone1, telephone2, mobilephone, address1_line1, address1_city, address1_stateorprovince, address1_postalcode, address1_country) values
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nathan', 'IT Director', 'priya.nathan@northwindhealth.example', null, '02 9000 1121', null, '0400 111 221', '1 Flinders St', 'Melbourne', 'VIC', '3000', 'Australia'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111112', 'Tom', 'Reilly', 'Operations Manager', 'tom.reilly@contosoagedcare.example', null, '02 9000 1122', null, '0400 111 222', '22 George St', 'Sydney', 'NSW', '2000', 'Australia'),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111113', 'Ava', 'Chen', 'CX Lead', 'ava.chen@fabrikamretail.example', null, '02 9000 1123', null, '0400 111 223', '5 Queen St', 'Brisbane', 'QLD', '4000', 'Australia');

  insert into dynamics.opportunity (opportunityid, parentaccountid, parentcontactid, name, estimatedvalue, estimatedclosedate, salesstage) values
    ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Contact Centre Modernisation', 185000, '2026-10-15', 'Develop'),
    ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'Scheduling Integration', 92000, '2026-09-01', 'Propose'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222223', 'Digital Front Door Rollout', 260000, '2026-11-30', 'Qualify');

  insert into dynamics.lead (leadid, firstname, lastname, companyname, subject, emailaddress1, telephone1, mobilephone, statuscode) values
    ('44444444-4444-4444-4444-444444444441', 'Sam', 'Doyle', 'Woodgrove Bank', 'Interested in contact centre demo', 'sam.doyle@woodgrove.example', '02 9000 1441', '0400 111 441', 'New'),
    ('44444444-4444-4444-4444-444444444442', 'Lena', 'Kaur', 'Adatum Insurance', 'Requested pricing for scheduling module', 'lena.kaur@adatum.example', '02 9000 1442', '0400 111 442', 'Contacted');

  insert into dynamics.annotation (objectid, objecttypecode, subject, notetext) values
    ('22222222-2222-2222-2222-222222222221', 'contact', 'Renewal call', 'Discussed renewal timeline, wants a demo of the reporting dashboard before committing.'),
    ('22222222-2222-2222-2222-222222222222', 'contact', 'Onboarding note', 'Prefers email over phone. Best reached after 2pm.');
end;
$$;

-- Only the service role (used by the Edge Function) may call this.
revoke execute on function dynamics.reset_demo_data() from public, anon, authenticated;
grant execute on function dynamics.reset_demo_data() to service_role;

-- Run it once now to populate initial data.
select dynamics.reset_demo_data();
