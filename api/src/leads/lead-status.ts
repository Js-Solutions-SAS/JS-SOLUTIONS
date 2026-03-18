export const LEAD_STATUS = {
  DIAGNOSTIC_CAPTURED: 'diagnostic_captured',
  BRIEF_REQUESTED: 'brief_requested',
  BRIEF_SUBMITTED: 'brief_submitted',
  QUOTE_IN_REVIEW: 'quote_in_review',
  QUOTE_SIGNED: 'quote_signed',
  CONTRACT_SENT: 'contract_sent',
  CONTRACT_SIGNED: 'contract_signed',
} as const;

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

