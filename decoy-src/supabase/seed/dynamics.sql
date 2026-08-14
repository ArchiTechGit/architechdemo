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
    ('11111111-1111-1111-1111-111111111113', 'Fabrikam Retail', '02 9000 1113', 'fabrikamretail.example', '5 Queen St', 'Brisbane', 'QLD', '4000', 'Australia', 'Retail'),
    ('11111111-1111-1111-1111-111111111114', 'St. Augustine Regional Hospital', '03 8000 2001', 'staugustinehealth.example', '45 Hospital Rd', 'Geelong', 'VIC', '3220', 'Australia', 'Healthcare'),
    ('11111111-1111-1111-1111-111111111115', 'Riverside Aged Care Group', '03 8000 2002', 'riversideagedcare.example', '12 Riverside Dr', 'Ballarat', 'VIC', '3350', 'Australia', 'Aged Care'),
    ('11111111-1111-1111-1111-111111111116', 'Metro Ambulance Service', '1300 800 2003', 'metroambulance.example', '200 Response Way', 'Melbourne', 'VIC', '3004', 'Australia', 'Emergency Services'),
    ('11111111-1111-1111-1111-111111111117', 'Coastal SES', '1300 800 2004', 'coastalses.example', '8 Response St', 'Torquay', 'VIC', '3228', 'Australia', 'Emergency Services'),
    ('11111111-1111-1111-1111-111111111118', 'Golden Years Retirement Villages', '03 8000 2005', 'goldenyearsliving.example', '77 Sunset Blvd', 'Bendigo', 'VIC', '3550', 'Australia', 'Aged Care'),
    ('11111111-1111-1111-1111-111111111119', 'Bayside Fire & Rescue', '1300 800 2006', 'baysidefire.example', '3 Firestation Rd', 'Frankston', 'VIC', '3199', 'Australia', 'Emergency Services'),
    ('1111111a-1111-1111-1111-11111111111a', 'Sunrise Community Health', '03 8000 2007', 'sunrisecommunityhealth.example', '21 Wellbeing Ave', 'Shepparton', 'VIC', '3630', 'Australia', 'Healthcare'),
    ('1111111a-1111-1111-1111-11111111111b', 'National Poison Control Network', '1300 800 2008', 'poisoncontrolnetwork.example', '9 Toxicology Ln', 'Canberra', 'ACT', '2600', 'Australia', 'Critical Services'),
    ('1111111a-1111-1111-1111-11111111111c', 'Harborview Critical Care Network', '03 8000 2009', 'harborviewcriticalcare.example', '55 Critical Care Cct', 'Geelong', 'VIC', '3220', 'Australia', 'Healthcare'),
    ('1111111a-1111-1111-1111-11111111111d', 'Lifeline Crisis Support', '1300 800 2010', 'lifelinecrisis.example', '14 Support St', 'Adelaide', 'SA', '5000', 'Australia', 'Critical Services');

  insert into dynamics.contact (contactid, parentcustomerid, firstname, lastname, jobtitle, emailaddress1, emailaddress2, telephone1, telephone2, mobilephone, address1_line1, address1_city, address1_stateorprovince, address1_postalcode, address1_country) values
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Priya', 'Nathan', 'IT Director', 'priya.nathan@northwindhealth.example', null, '02 9000 1121', null, '0400 111 221', '1 Flinders St', 'Melbourne', 'VIC', '3000', 'Australia'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111112', 'Tom', 'Reilly', 'Operations Manager', 'tom.reilly@contosoagedcare.example', null, '02 9000 1122', null, '0400 111 222', '22 George St', 'Sydney', 'NSW', '2000', 'Australia'),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111113', 'Ava', 'Chen', 'CX Lead', 'ava.chen@fabrikamretail.example', null, '02 9000 1123', null, '0400 111 223', '5 Queen St', 'Brisbane', 'QLD', '4000', 'Australia'),
    ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111114', 'Dr. Helen', 'Ortiz', 'Chief Information Officer', 'helen.ortiz@staugustinehealth.example', null, '03 8000 2021', null, '0400 200 221', '45 Hospital Rd', 'Geelong', 'VIC', '3220', 'Australia'),
    ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111115', 'Marcus', 'Tan', 'Director of Care', 'marcus.tan@riversideagedcare.example', null, '03 8000 2022', null, '0400 200 222', '12 Riverside Dr', 'Ballarat', 'VIC', '3350', 'Australia'),
    ('22222222-2222-2222-2222-222222222226', '11111111-1111-1111-1111-111111111116', 'Renee', 'Falk', 'Operations Director', 'renee.falk@metroambulance.example', null, '1300 800 2023', null, '0400 200 223', '200 Response Way', 'Melbourne', 'VIC', '3004', 'Australia'),
    ('22222222-2222-2222-2222-222222222227', '11111111-1111-1111-1111-111111111117', 'Callum', 'Reid', 'Volunteer Coordinator', 'callum.reid@coastalses.example', null, '1300 800 2024', null, '0400 200 224', '8 Response St', 'Torquay', 'VIC', '3228', 'Australia'),
    ('22222222-2222-2222-2222-222222222228', '11111111-1111-1111-1111-111111111118', 'Nadia', 'Petrov', 'Chief Executive Officer', 'nadia.petrov@goldenyearsliving.example', null, '03 8000 2025', null, '0400 200 225', '77 Sunset Blvd', 'Bendigo', 'VIC', '3550', 'Australia'),
    ('22222222-2222-2222-2222-222222222229', '11111111-1111-1111-1111-111111111119', 'Josh', 'Whitfield', 'Station Commander', 'josh.whitfield@baysidefire.example', null, '1300 800 2026', null, '0400 200 226', '3 Firestation Rd', 'Frankston', 'VIC', '3199', 'Australia'),
    ('2222222a-2222-2222-2222-22222222222a', '1111111a-1111-1111-1111-11111111111a', 'Dr. Amara', 'Singh', 'Clinical Director', 'amara.singh@sunrisecommunityhealth.example', null, '03 8000 2027', null, '0400 200 227', '21 Wellbeing Ave', 'Shepparton', 'VIC', '3630', 'Australia'),
    ('2222222a-2222-2222-2222-22222222222b', '1111111a-1111-1111-1111-11111111111b', 'Ellis', 'Grant', 'IT Manager', 'ellis.grant@poisoncontrolnetwork.example', null, '1300 800 2028', null, '0400 200 228', '9 Toxicology Ln', 'Canberra', 'ACT', '2600', 'Australia'),
    ('2222222a-2222-2222-2222-22222222222c', '1111111a-1111-1111-1111-11111111111c', 'Dr. Rowan', 'Blake', 'Head of ICU', 'rowan.blake@harborviewcriticalcare.example', null, '03 8000 2029', null, '0400 200 229', '55 Critical Care Cct', 'Geelong', 'VIC', '3220', 'Australia'),
    ('2222222a-2222-2222-2222-22222222222d', '1111111a-1111-1111-1111-11111111111d', 'Priya', 'Malhotra', 'Program Manager', 'priya.malhotra@lifelinecrisis.example', null, '1300 800 2030', null, '0400 200 230', '14 Support St', 'Adelaide', 'SA', '5000', 'Australia');

  insert into dynamics.opportunity (opportunityid, parentaccountid, parentcontactid, name, estimatedvalue, estimatedclosedate, salesstage) values
    ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Contact Centre Modernisation', 185000, '2026-10-15', 'Develop'),
    ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222222', 'Scheduling Integration', 92000, '2026-09-01', 'Propose'),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111113', '22222222-2222-2222-2222-222222222223', 'Digital Front Door Rollout', 260000, '2026-11-30', 'Qualify'),
    ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111114', '22222222-2222-2222-2222-222222222224', 'Emergency Dept Patient Communication Upgrade', 210000, '2026-12-01', 'Develop'),
    ('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111115', '22222222-2222-2222-2222-222222222225', 'Family Contact Centre Modernisation', 95000, '2026-11-15', 'Qualify'),
    ('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111116', '22222222-2222-2222-2222-222222222226', 'Dispatch & Callback Automation', 340000, '2027-01-20', 'Propose'),
    ('33333333-3333-3333-3333-333333333337', '11111111-1111-1111-1111-111111111117', '22222222-2222-2222-2222-222222222227', 'Volunteer Coordination Contact Centre', 60000, '2026-10-30', 'Qualify'),
    ('33333333-3333-3333-3333-333333333338', '11111111-1111-1111-1111-111111111118', '22222222-2222-2222-2222-222222222228', 'Resident & Family Engagement Platform', 150000, '2026-12-10', 'Develop'),
    ('33333333-3333-3333-3333-333333333339', '11111111-1111-1111-1111-111111111119', '22222222-2222-2222-2222-222222222229', 'Emergency Alert Notification System', 220000, '2027-02-05', 'Propose'),
    ('3333333a-3333-3333-3333-33333333333a', '1111111a-1111-1111-1111-11111111111a', '2222222a-2222-2222-2222-22222222222a', 'Telehealth Triage Line', 128000, '2026-11-01', 'Qualify'),
    ('3333333a-3333-3333-3333-33333333333b', '1111111a-1111-1111-1111-11111111111b', '2222222a-2222-2222-2222-22222222222b', '24/7 Crisis Line Scaling', 410000, '2026-09-15', 'Close'),
    ('3333333a-3333-3333-3333-33333333333c', '1111111a-1111-1111-1111-11111111111c', '2222222a-2222-2222-2222-22222222222c', 'ICU Family Liaison Contact Centre', 175000, '2026-12-20', 'Develop'),
    ('3333333a-3333-3333-3333-33333333333d', '1111111a-1111-1111-1111-11111111111d', '2222222a-2222-2222-2222-22222222222d', 'Crisis Text & Voice Integration', 260000, '2027-01-10', 'Propose');

  insert into dynamics.lead (leadid, firstname, lastname, companyname, subject, emailaddress1, telephone1, mobilephone, statuscode) values
    ('44444444-4444-4444-4444-444444444441', 'Sam', 'Doyle', 'Woodgrove Bank', 'Interested in contact centre demo', 'sam.doyle@woodgrove.example', '02 9000 1441', '0400 111 441', 'New'),
    ('44444444-4444-4444-4444-444444444442', 'Lena', 'Kaur', 'Adatum Insurance', 'Requested pricing for scheduling module', 'lena.kaur@adatum.example', '02 9000 1442', '0400 111 442', 'Contacted'),
    ('44444444-4444-4444-4444-444444444443', 'Anna', 'Kowalski', 'Southern Cross Aged Care', 'Interested in resident communication platform', 'anna.kowalski@southerncrossagedcare.example', '03 8000 2441', '0400 200 441', 'New'),
    ('44444444-4444-4444-4444-444444444444', 'Derek', 'Holt', 'Valley Emergency Medical', 'Requested dispatch automation demo', 'derek.holt@valleyemergencymedical.example', '1300 800 2442', '0400 200 442', 'Contacted'),
    ('44444444-4444-4444-4444-444444444445', 'Fatima', 'Noor', 'Northern Health Alliance', 'Enquiry re: telehealth triage line', 'fatima.noor@northernhealthalliance.example', '03 8000 2443', '0400 200 443', 'New'),
    ('44444444-4444-4444-4444-444444444446', 'Sam', 'Whitlock', 'Coastal Rescue Helicopter Service', 'Wants pricing for emergency alert system', 'sam.whitlock@coastalrescuehelicopter.example', '1300 800 2444', '0400 200 444', 'Qualified'),
    ('44444444-4444-4444-4444-444444444447', 'Grace', 'Liu', 'Eldercare Plus', 'Follow up on aged care contact centre proposal', 'grace.liu@eldercareplus.example', '03 8000 2445', '0400 200 445', 'Contacted');

  insert into dynamics.annotation (objectid, objecttypecode, subject, notetext) values
    ('22222222-2222-2222-2222-222222222221', 'contact', 'Renewal call', 'Discussed renewal timeline, wants a demo of the reporting dashboard before committing.'),
    ('22222222-2222-2222-2222-222222222222', 'contact', 'Onboarding note', 'Prefers email over phone. Best reached after 2pm.'),
    ('22222222-2222-2222-2222-222222222224', 'contact', 'Winter surge planning', 'ED overflow during winter flu season - wants faster call routing in place before next winter.'),
    ('22222222-2222-2222-2222-222222222226', 'contact', 'Pilot in progress', 'Currently piloting with 3 ambulance stations, evaluating full regional rollout for Q1.'),
    ('22222222-2222-2222-2222-222222222229', 'contact', 'CAD integration request', 'Requested integration with their existing computer-aided dispatch (CAD) system before sign-off.');
end;
$$;

-- Only the service role (used by the Edge Function) may call this.
revoke execute on function dynamics.reset_demo_data() from public, anon, authenticated;
grant execute on function dynamics.reset_demo_data() to service_role;

-- Run it once now to populate initial data.
select dynamics.reset_demo_data();
