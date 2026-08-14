const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/alayacare-api/AlayaCare/v1`;

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
      <code>{children}</code>
    </pre>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      <div className="space-y-3 text-sm text-gray-700">{children}</div>
    </section>
  );
}

export default function AlayacareHelpPage() {
  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-700">Alayacare API Reference</h1>
        <p className="text-sm text-gray-500">
          Three endpoints below (marked <strong>Captured</strong>) reproduce real Alayacare
          integration traffic byte-for-byte. Everything marked <strong>Inferred</strong> was built
          to match that traffic&apos;s conventions but was not itself observed in real traffic — treat
          it as plausible, not verified, if you&apos;re validating against a real Alayacare tenant.
        </p>
      </div>

      <Section title="Base URL">
        <Code>{BASE}</Code>
      </Section>

      <Section title="Client — GET /client-profile/{client_id} (Captured)">
        <Code>{`GET ${BASE}/client-profile/C0100001

→ 200 OK
{
  "client_id": "C0100001",
  "salutation": "Mrs",
  "first_name": "Margaret",
  "last_name": "Voss",
  "birthday": "1938-03-14",
  "zip": "3220",
  "phone_main": "+61411300001",
  "ai_agent_opt_out": "",
  "channels_of_communication": "Phone Call",
  "types_of_communication": "",
  "notification_recipient": "Client",
  "contacts": []
}`}</Code>
      </Section>

      <Section title="Client — GET /client-profile (Inferred: list-all)">
        <p>Same pagination envelope as the captured scheduled-visits endpoint, applied here by inference.</p>
        <Code>{`GET ${BASE}/client-profile?page=1

→ 200 OK
{ "count": 5, "page": 1, "total_pages": 1, "items": [ { "client_id": "C0100001", ... }, ... ] }`}</Code>
      </Section>

      <Section title="Client — POST / PATCH / DELETE (Inferred)">
        <Code>{`POST ${BASE}/client-profile
Content-Type: application/json

{ "first_name": "Jordan", "last_name": "Reyes", "phone_main": "+61400111222" }

→ 201 Created  (client_id is generated, e.g. "C0200000")

PATCH ${BASE}/client-profile/C0200000
{ "phone_main": "+61400111333" }
→ 200 OK

DELETE ${BASE}/client-profile/C0200000
→ 204 No Content`}</Code>
      </Section>

      <Section title="Visits — GET /scheduled-visits (Captured shape, params relaxed)">
        <p>
          The real capture always passed <code>client_id</code>; here it&apos;s optional, so a
          schedules view can list all visits. <code>start_at</code>/<code>end_at</code> are also
          optional range filters.
        </p>
        <Code>{`GET ${BASE}/scheduled-visits?client_id=C0100001&page=1

→ 200 OK
{
  "count": 2,
  "page": 1,
  "total_pages": 1,
  "items": [
    {
      "alayacare_visit_id": 1,
      "alayacare_service_id": 610001,
      "employee_id": "051201",
      "service_code_id": 43,
      "status": "scheduled",
      "start_at": "2026-08-20T05:25:00+00:00",
      "end_at": "2026-08-20T06:25:00+00:00",
      "cancelled": false,
      "client_id": "C0100001"
    }
  ]
}`}</Code>
      </Section>

      <Section title="Visits — POST / PATCH / DELETE (Inferred)">
        <Code>{`POST ${BASE}/scheduled-visits
{ "client_id": "C0100001", "employee_id": "051201", "status": "scheduled", "start_at": "2026-09-01T05:00:00+00:00", "end_at": "2026-09-01T06:00:00+00:00" }
→ 201 Created

PATCH ${BASE}/scheduled-visits/1
{ "status": "completed" }
→ 200 OK

DELETE ${BASE}/scheduled-visits/1
→ 204 No Content`}</Code>
      </Section>

      <Section title="Care team — GET /cancelled-visit/staff-contacts/{visit_id} (Captured)">
        <p>
          Read-only. Returns the care team assigned to the visit&apos;s client — note the path says
          &quot;cancelled-visit&quot; but this works for any visit, cancelled or not; that&apos;s a
          real quirk of the source system&apos;s naming, kept intact here on purpose.
        </p>
        <Code>{`GET ${BASE}/cancelled-visit/staff-contacts/1

→ 200 OK
{
  "care_team": [
    { "employee_id": "051201", "first_name": "Nathan", "last_name": "Brice", "role": "Support Worker", "email": "nbrice@agedcaredemo.example" },
    { "employee_id": "", "first_name": "Simone", "last_name": "Achebe", "role": "Team Leader", "email": "sachebe@agedcaredemo.example" }
  ]
}`}</Code>
      </Section>

      <Section title="Using this from a Webex Contact Center flow">
        <p>
          Same pattern as the Dynamics reference: an HTTP Request activity can call any endpoint
          above directly. CORS is enabled (<code>Access-Control-Allow-Origin: *</code>), so
          browser-based flow steps work too, not just server-side ones.
        </p>
      </Section>
    </div>
  );
}
