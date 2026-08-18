const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/epic-api/api/FHIR/R4`;
const TOKEN_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/epic-api/oauth2/token`;

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

const RESOURCES = [
  { name: 'Patient', fields: 'identifier, name, gender, birthDate, address, telecom' },
  { name: 'Encounter', fields: 'status, class, subject, period, serviceProvider, location' },
  { name: 'Condition', fields: 'clinicalStatus, code (ICD-10), subject' },
  { name: 'MedicationRequest', fields: 'status, medicationCodeableConcept, subject, dosageInstruction, authoredOn' },
  { name: 'Observation', fields: 'status, code (LOINC), subject, effectiveDateTime, valueQuantity' },
  { name: 'AllergyIntolerance', fields: 'clinicalStatus, code, patient, reaction' },
  { name: 'DiagnosticReport', fields: 'status, code, subject, effectiveDateTime' },
  { name: 'Procedure', fields: 'status, code, subject, performedDateTime' },
  { name: 'Practitioner', fields: 'name, identifier' },
  { name: 'PractitionerRole', fields: 'practitioner, specialty' },
];

export default function EpicHelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-700">Epic API Reference (FHIR R4)</h1>
        <p className="text-sm text-gray-500">
          This demo exposes a FHIR R4-conformant REST API, matching the URL pattern, OAuth2/SMART-on-FHIR
          token flow, and resource JSON shape a genuine Epic on FHIR integration uses. Every endpoint below
          is marked <strong>FHIR R4 (public spec)</strong> rather than Captured/Inferred like ArchiTech
          Care&apos;s API reference &mdash; there is no real Epic traffic sample to compare against here,
          only conformance to the open HL7 standard Epic itself implements.
        </p>
      </div>

      <Section title="Base URL">
        <Code>{BASE}</Code>
        <p>Every resource below is a path under this base: <code>{'{base}'}/&lt;ResourceType&gt;[/&lt;id&gt;]</code>.</p>
      </Section>

      <Section title="Authentication (SMART on FHIR, cosmetic)">
        <p>
          Real Epic integrations use SMART Backend Services: a client-credentials JWT-bearer exchange at a
          token endpoint. This demo&apos;s token endpoint accepts the same shape but performs no real
          validation:
        </p>
        <Code>{`POST ${TOKEN_URL}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_assertion_type=...&client_assertion=<any-jwt-shaped-value>`}</Code>
        <p>Returns:</p>
        <Code>{`{"access_token":"epic-demo-token","token_type":"Bearer","expires_in":3600,"scope":"system/*.read"}`}</Code>
        <p>Send any value in <code>Authorization: Bearer &lt;token&gt;</code> on subsequent calls — the server ignores its actual value.</p>
      </Section>

      <Section title="Resources">
        {RESOURCES.map((r) => (
          <div key={r.name} className="border-b pb-2 last:border-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{r.name}</span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">FHIR R4 (public spec)</span>
            </div>
            <p className="font-mono text-xs text-gray-500">{r.fields}</p>
          </div>
        ))}
      </Section>

      <Section title="Example">
        <Code>{`GET ${BASE}/Patient/astrid-nygaard
Authorization: Bearer epic-demo-token`}</Code>
        <p>Search example (Bundle response):</p>
        <Code>{`GET ${BASE}/Encounter?patient=astrid-nygaard`}</Code>
      </Section>
    </div>
  );
}
