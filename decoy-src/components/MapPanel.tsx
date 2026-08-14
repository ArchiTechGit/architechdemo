// Purely decorative -- a static stand-in for AlayaCare's live GPS staff map.
// No real coordinate data exists in this demo (clients only have city/postcode
// text), so this never becomes interactive or data-driven. See CLAUDE.md.
export function MapPanel() {
  return (
    <div className="overflow-hidden rounded border bg-white shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">Map</h2>
      </div>
      <div className="relative h-64 bg-[#eef1e8]">
        <svg viewBox="0 0 400 260" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="260" fill="#eef1e8" />
          <path d="M0 40 H400" stroke="#d8dccb" strokeWidth="6" />
          <path d="M0 150 H400" stroke="#d8dccb" strokeWidth="10" />
          <path d="M0 210 H400" stroke="#d8dccb" strokeWidth="4" />
          <path d="M70 0 V260" stroke="#d8dccb" strokeWidth="5" />
          <path d="M180 0 V260" stroke="#d8dccb" strokeWidth="8" />
          <path d="M300 0 V260" stroke="#d8dccb" strokeWidth="4" />
          <path d="M0 0 L400 260" stroke="#e3e6d6" strokeWidth="14" />
          <path d="M40 0 C120 90, 260 60, 400 140" stroke="#fceec4" strokeWidth="10" fill="none" />
        </svg>
        <div className="absolute left-[46%] top-[42%] -translate-x-1/2 -translate-y-full">
          <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
            <path
              d="M14 0C6.3 0 0 6.3 0 14c0 10 14 20 14 20s14-10 14-20C28 6.3 21.7 0 14 0Z"
              fill="#d6483f"
            />
            <circle cx="14" cy="14" r="5.5" fill="white" />
          </svg>
        </div>
        <div className="absolute left-[52%] top-[36%] w-52 rounded border bg-white p-2 text-xs shadow-md">
          <div className="font-medium text-gray-800">Lisa Clinical Manager</div>
          <div className="text-gray-600">Tyrone Maguire</div>
          <div className="mt-1 text-gray-500">Home Health</div>
          <div className="text-gray-400">02:30 PM–02:45 PM</div>
        </div>
      </div>
    </div>
  );
}
