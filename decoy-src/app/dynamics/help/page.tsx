const BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dataverse-api/api/data/v9.2`;
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

export default function HelpPage() {
  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-700">Dynamics 365 Web API Reference</h1>
        <p className="text-sm text-gray-500">
          This demo exposes the real Dataverse Web API v9.2 (OData v4) request shape — the same
          URLs, query params, body format, and headers a genuine Dynamics 365 integration uses.
          Point any HTTP-capable integration (including a Webex Contact Center flow's HTTP request
          node) directly at these endpoints.
        </p>
      </div>

      <Section title="Base URL">
        <Code>{BASE}</Code>
        <p>Every entity set below is a path under this base: <code>{'{base}'}/&lt;entityset&gt;</code>.</p>
      </Section>

      <Section title="Authentication">
        <p>
          This is an open demo — there is no real auth. Send any value in the headers below; the
          server ignores it. They&apos;re included so requests look like a genuine OAuth-authenticated
          Dynamics call in network inspection tools:
        </p>
        <Code>{`OData-MaxVersion: 4.0
OData-Version: 4.0
Content-Type: application/json; charset=utf-8
Accept: application/json
Authorization: Bearer <any-value>`}</Code>
      </Section>

      <Section title="Entity sets">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500">
              <th className="p-2 font-medium">Entity set</th>
              <th className="p-2 font-medium">Primary key</th>
              <th className="p-2 font-medium">Lookup fields (writeable via @odata.bind)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-2 font-mono">accounts</td>
              <td className="p-2 font-mono">accountid</td>
              <td className="p-2 text-gray-400">—</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">contacts</td>
              <td className="p-2 font-mono">contactid</td>
              <td className="p-2 font-mono">parentcustomerid_account → accounts</td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">opportunities</td>
              <td className="p-2 font-mono">opportunityid</td>
              <td className="p-2 font-mono">
                parentaccountid_account → accounts
                <br />
                parentcontactid_contact → contacts
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-2 font-mono">leads</td>
              <td className="p-2 font-mono">leadid</td>
              <td className="p-2 text-gray-400">—</td>
            </tr>
            <tr>
              <td className="p-2 font-mono">annotations</td>
              <td className="p-2 font-mono">annotationid</td>
              <td className="p-2 text-gray-400">— (polymorphic: set objectid + objecttypecode directly)</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="GET — list records">
        <p>
          Supports <code>$select</code>, <code>$orderby</code>, and one level of <code>$expand</code>{' '}
          on a lookup field. Defaults to <code>$orderby=createdon desc</code> if omitted.
        </p>
        <Code>{`GET ${BASE}/accounts?$select=name,telephone1&$orderby=name

→ 200 OK
{
  "@odata.context": "$metadata#accounts",
  "value": [
    { "name": "Contoso Aged Care", "telephone1": "02 9000 1112" },
    { "name": "Fabrikam Retail", "telephone1": "02 9000 1113" }
  ]
}`}</Code>
        <p>Expand a lookup to a related record&apos;s fields, e.g. a contact&apos;s account name:</p>
        <Code>{`GET ${BASE}/contacts?$expand=parentcustomerid_account($select=name)

→ 200 OK
{
  "@odata.context": "$metadata#contacts",
  "value": [
    {
      "contactid": "22222222-2222-2222-2222-222222222221",
      "firstname": "Priya",
      "lastname": "Nathan",
      "parentcustomerid": "11111111-1111-1111-1111-111111111111",
      "parentcustomerid_account": { "accountid": "11111111-...", "name": "Northwind Health" }
    }
  ]
}`}</Code>
      </Section>

      <Section title="GET — single record">
        <Code>{`GET ${BASE}/leads(44444444-4444-4444-4444-444444444441)

→ 200 OK
{ "leadid": "44444444-...", "firstname": "Sam", "lastname": "Doyle", "statuscode": "New", ... }

→ 404 if the id doesn't exist`}</Code>
      </Section>

      <Section title="POST — create a record">
        <p>
          Plain fields go straight in the body. A lookup field is set via{' '}
          <code>&quot;&lt;bindProperty&gt;@odata.bind&quot;: &quot;/&lt;targetset&gt;(&lt;guid&gt;)&quot;</code>{' '}
          — exactly like a real Dynamics create call.
        </p>
        <Code>{`POST ${BASE}/contacts
Content-Type: application/json

{
  "firstname": "Jordan",
  "lastname": "Reyes",
  "emailaddress1": "jordan.reyes@example.com",
  "parentcustomerid_account@odata.bind": "/accounts(11111111-1111-1111-1111-111111111111)"
}

→ 201 Created
{ "contactid": "<new-guid>", "firstname": "Jordan", "lastname": "Reyes", ... }`}</Code>
      </Section>

      <Section title="PATCH — update a record">
        <p>Same body rules as POST. Only send the fields you want to change.</p>
        <Code>{`PATCH ${BASE}/opportunities(33333333-3333-3333-3333-333333333331)
Content-Type: application/json

{ "salesstage": "Propose" }

→ 204 No Content`}</Code>
      </Section>

      <Section title="DELETE — remove a record">
        <Code>{`DELETE ${BASE}/leads(44444444-4444-4444-4444-444444444441)

→ 204 No Content`}</Code>
      </Section>

      <Section title="Field reference">
        <p className="font-medium text-gray-800">account</p>
        <p className="font-mono text-xs text-gray-500">
          accountid, name, telephone1, websiteurl, address1_line1, address1_city,
          address1_stateorprovince, address1_postalcode, address1_country, industrycode, createdon
        </p>
        <p className="font-medium text-gray-800">contact</p>
        <p className="font-mono text-xs text-gray-500">
          contactid, parentcustomerid, firstname, lastname, jobtitle, emailaddress1, emailaddress2,
          telephone1, telephone2, mobilephone, address1_line1, address1_city,
          address1_stateorprovince, address1_postalcode, address1_country, createdon
        </p>
        <p className="font-medium text-gray-800">opportunity</p>
        <p className="font-mono text-xs text-gray-500">
          opportunityid, parentaccountid, parentcontactid, name, estimatedvalue,
          estimatedclosedate, salesstage, createdon
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">salesstage</span> allowed values:{' '}
          <code>Qualify</code>, <code>Develop</code>, <code>Propose</code>, <code>Close</code>
        </p>
        <p className="font-medium text-gray-800">lead</p>
        <p className="font-mono text-xs text-gray-500">
          leadid, firstname, lastname, companyname, subject, emailaddress1, telephone1,
          mobilephone, leadsourcecode, statuscode, createdon
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">statuscode</span> allowed values: <code>New</code>,{' '}
          <code>Contacted</code>, <code>Qualified</code>, <code>Disqualified</code>
        </p>
        <p className="font-medium text-gray-800">annotation (Notes)</p>
        <p className="font-mono text-xs text-gray-500">
          annotationid, objectid, objecttypecode, subject, notetext, createdon
        </p>
        <p className="text-xs text-gray-500">
          <span className="font-medium">objecttypecode</span> allowed values: <code>account</code>,{' '}
          <code>contact</code>, <code>lead</code>, <code>opportunity</code> — set{' '}
          <code>objectid</code> to that record&apos;s id to attach a note to it.
        </p>
      </Section>

      <Section title="Using this from a Webex Contact Center flow">
        <p>
          In Flow Designer, an HTTP Request activity can call any endpoint above directly — set the
          method (GET/POST/PATCH/DELETE), the URL (base + entity set, with an <code>(id)</code>{' '}
          suffix for a single record), and the headers from the Authentication section. For a
          lookup call inside a flow (e.g. &quot;find the account for this caller&apos;s phone
          number&quot;), use <code>$select</code> to keep the response small, and <code>$expand</code>{' '}
          on a lookup field when the flow needs a related record&apos;s name in one call instead of
          two.
        </p>
        <p>
          CORS is enabled on every endpoint (<code>Access-Control-Allow-Origin: *</code>), so this
          also works from a browser-based flow step, not just server-side ones.
        </p>
      </Section>

      <Section title="Demo control — not part of the API surface">
        <p>
          One additional endpoint resets all Dynamics demo data back to its seed state. It has no
          real-Dynamics equivalent — don&apos;t wire a production flow to it, it&apos;s here for
          resetting between demos.
        </p>
        <Code>{`POST ${RESET_URL}
Content-Type: application/json

{ "schema": "dynamics" }

→ 200 OK
{ "ok": true }`}</Code>
      </Section>
    </div>
  );
}
