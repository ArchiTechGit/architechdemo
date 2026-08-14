const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/archicare-api/AlayaCare/v1`;
const RESET_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/reset-demo`;

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

export default function ArchicareHelpPage() {
  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-700">ArchiCare API Reference</h1>
        <p className="text-sm text-gray-500">
          This demo exposes the real ArchiCare REST API request shape — plain REST verbs, no OData,
          same URL pattern and body format a genuine ArchiCare integration uses. Point any
          HTTP-capable integration (including a Webex Contact Center flow&apos;s HTTP Request node)
          directly at these endpoints. Three endpoints below (marked <strong>Captured</strong>)
          reproduce real integration traffic byte-for-byte. Everything marked{' '}
          <strong>Inferred</strong> was built to match that traffic&apos;s conventions but was not
          itself observed in real traffic — treat it as plausible, not verified, if you&apos;re
          validating against a real ArchiCare tenant.
        </p>
      </div>

      <Section title="Base URL">
        <Code>{BASE}</Code>
        <p>Every resource below is a path under this base: <code>{'{base}'}/&lt;resource&gt;[/&lt;id&gt;]</code>.</p>
      </Section>

      <Section title="Authentication">
        <p>
          This is an open demo — there is no real auth. Send any value in the header below; the
          server ignores it. It&apos;s included so requests look like a genuine authenticated
          ArchiCare call in network inspection tools:
        </p>
        <Code>{`Authorization: Bearer <any-value>
Content-Type: application/json`}</Code>
      </Section>

      <Section title="Resources">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500">
              <th className="p-2 font-medium">Resource</th>
              <th className="p-2 font-medium">Primary key</th>
              <th className="p-2 font-medium">Verbs</th>
              <th className="p-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">client-profile/{'{id}'}</td>
              <td className="p-2 font-mono">client_id</td>
              <td className="p-2 font-mono">GET</td>
              <td className="p-2">Captured</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">client-profile</td>
              <td className="p-2 text-gray-400">—</td>
              <td className="p-2 font-mono">GET (list), POST, PATCH, DELETE</td>
              <td className="p-2">Inferred</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">scheduled-visits</td>
              <td className="p-2 font-mono">alayacare_visit_id</td>
              <td className="p-2 font-mono">GET</td>
              <td className="p-2">Captured shape, params relaxed</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">scheduled-visits</td>
              <td className="p-2 font-mono">alayacare_visit_id</td>
              <td className="p-2 font-mono">POST, PATCH, DELETE</td>
              <td className="p-2">Inferred</td>
            </tr>
            <tr>
              <td className="p-2 font-mono">cancelled-visit/staff-contacts/{'{visit_id}'}</td>
              <td className="p-2 text-gray-400">—</td>
              <td className="p-2 font-mono">GET</td>
              <td className="p-2">Captured</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="Client — GET /client-profile/{client_id} (Captured)">
        <p>
          The <code>client_id</code> through <code>contacts</code> fields below are the exact shape
          captured from real traffic. <code>status</code> through <code>services</code> were added
          in later demo migrations to back UI features (client status, address, a second
          identifier, free-text risks, a services list) — same REST resource, but those five fields
          are Inferred additions layered on top of a Captured base, not themselves observed in real
          traffic.
        </p>
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
  "contacts": [],
  "status": "Active",
  "address_line": "14 Ryrie St",
  "city": "Geelong",
  "state": "VIC",
  "external_id": "2088101",
  "risks": "Fall history, Lives alone",
  "services": ["Personal Support", "Respite", "Assessments"]
}`}</Code>
      </Section>

      <Section title="Client — GET /client-profile (Inferred: list-all)">
        <p>Same pagination envelope as the captured scheduled-visits endpoint, applied here by inference.</p>
        <Code>{`GET ${BASE}/client-profile?page=1

→ 200 OK
{ "count": 20, "page": 1, "total_pages": 1, "items": [ { "client_id": "C0100001", ... }, ... ] }`}</Code>
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

      <Section title="Field reference">
        <p className="font-medium text-gray-800">client-profile</p>
        <p className="font-mono text-xs text-gray-500">
          client_id, salutation, first_name, last_name, birthday, zip, phone_main,
          ai_agent_opt_out, channels_of_communication, types_of_communication,
          notification_recipient, contacts, createdon
        </p>
        <p className="text-xs text-gray-500">Captured fields (above) — real ArchiCare shape.</p>
        <p className="font-mono text-xs text-gray-500">
          status, address_line, city, state, external_id, risks, services
        </p>
        <p className="text-xs text-gray-500">
          Inferred additions (above) — <span className="font-medium">status</span> is{' '}
          <code>Active</code> or <code>Inactive</code>; <span className="font-medium">external_id</span>{' '}
          is a second identifier distinct from <code>client_id</code>; <span className="font-medium">risks</span>{' '}
          is free text; <span className="font-medium">services</span> is a string array. None of
          these came from captured traffic.
        </p>
        <p className="font-medium text-gray-800">scheduled-visits</p>
        <p className="font-mono text-xs text-gray-500">
          alayacare_visit_id, alayacare_service_id, employee_id, service_code_id, status, start_at,
          end_at, cancelled, client_id, createdon
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">status</span> allowed values: <code>scheduled</code>,{' '}
          <code>completed</code>, <code>cancelled</code>, <code>missed</code>
        </p>
        <p className="font-medium text-gray-800">care_team (nested in staff-contacts response)</p>
        <p className="font-mono text-xs text-gray-500">
          employee_id, first_name, last_name, role, email
        </p>
      </Section>

      <Section title="Using this from a Webex Contact Center flow">
        <p>
          In Flow Designer, an HTTP Request activity can call any endpoint above directly — set the
          method (GET/POST/PATCH/DELETE), the URL (base + resource, with a <code>/{'{id}'}</code>{' '}
          suffix for a single record), and the <code>Authorization</code> header from the
          Authentication section above. For a lookup call inside a flow (e.g. &quot;find this
          caller&apos;s upcoming visit&quot;), call <code>scheduled-visits?client_id=…</code> first
          to get the visit id, then <code>cancelled-visit/staff-contacts/{'{visit_id}'}</code> if the
          flow needs to read out who&apos;s on the care team.
        </p>
        <p>
          CORS is enabled on every endpoint (<code>Access-Control-Allow-Origin: *</code>), so this
          also works from a browser-based flow step, not just server-side ones.
        </p>
      </Section>

      <Section title="Demo control — not part of the API surface">
        <p>
          One additional endpoint resets all ArchiCare demo data back to its seed state. It has no
          real-ArchiCare equivalent — don&apos;t wire a production flow to it, it&apos;s here for
          resetting between demos.
        </p>
        <Code>{`POST ${RESET_URL}
Content-Type: application/json

{ "schema": "archicare" }

→ 200 OK
{ "ok": true }`}</Code>
      </Section>
    </div>
  );
}
