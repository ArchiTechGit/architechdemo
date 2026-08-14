export interface AlayacareClient {
  client_id: string;
  salutation: string | null;
  first_name: string;
  last_name: string;
  birthday: string | null;
  zip: string | null;
  phone_main: string | null;
  ai_agent_opt_out: string | null;
  channels_of_communication: string | null;
  types_of_communication: string | null;
  notification_recipient: string | null;
  contacts: unknown[];
  status: 'Active' | 'Inactive';
  address_line: string | null;
  city: string | null;
  state: string | null;
  external_id: string | null;
  risks: string | null;
  services: string[];
  createdon: string;
}

export interface AlayacareVisit {
  alayacare_visit_id: number;
  alayacare_service_id: number | null;
  employee_id: string | null;
  service_code_id: number | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  start_at: string | null;
  end_at: string | null;
  cancelled: boolean;
  client_id: string | null;
  createdon: string;
}

export interface CareTeamMember {
  employee_id: string | null;
  first_name: string;
  last_name: string;
  role: string | null;
  email: string | null;
}
