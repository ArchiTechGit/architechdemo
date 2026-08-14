export interface Account {
  accountid: string;
  name: string;
  telephone1: string | null;
  websiteurl: string | null;
  address1_line1: string | null;
  address1_city: string | null;
  address1_stateorprovince: string | null;
  address1_postalcode: string | null;
  address1_country: string | null;
  industrycode: string | null;
  createdon: string;
}

export interface Contact {
  contactid: string;
  parentcustomerid: string | null;
  firstname: string;
  lastname: string;
  jobtitle: string | null;
  emailaddress1: string | null;
  emailaddress2: string | null;
  telephone1: string | null;
  telephone2: string | null;
  mobilephone: string | null;
  address1_line1: string | null;
  address1_city: string | null;
  address1_stateorprovince: string | null;
  address1_postalcode: string | null;
  address1_country: string | null;
  createdon: string;
  parentcustomerid_account?: { accountid: string; name: string } | null;
}

export interface Opportunity {
  opportunityid: string;
  parentaccountid: string | null;
  parentcontactid: string | null;
  name: string;
  estimatedvalue: number | null;
  estimatedclosedate: string | null;
  salesstage: 'Qualify' | 'Develop' | 'Propose' | 'Close';
  createdon: string;
  parentaccountid_account?: { accountid: string; name: string } | null;
  parentcontactid_contact?: { contactid: string; firstname: string; lastname: string } | null;
}

export interface Lead {
  leadid: string;
  firstname: string;
  lastname: string;
  companyname: string | null;
  subject: string;
  emailaddress1: string | null;
  telephone1: string | null;
  mobilephone: string | null;
  leadsourcecode: string | null;
  statuscode: 'New' | 'Contacted' | 'Qualified' | 'Disqualified';
  createdon: string;
}

export interface Annotation {
  annotationid: string;
  objectid: string;
  objecttypecode: 'account' | 'contact' | 'lead' | 'opportunity';
  subject: string | null;
  notetext: string | null;
  createdon: string;
}
