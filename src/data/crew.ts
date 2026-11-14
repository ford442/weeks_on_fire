import { crewRecords } from './generated/crew';

import type { CrewMember } from './types';

export type { CrewMember, CrewRecord, CrewRole } from './types';

/** Cast portraits live in public/cast and ship via deploy.py with the site. */
function sitePrefix(): string {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return '';
  const first = window.location.pathname.split('/').filter(Boolean)[0];
  if (first === 'weeks-on-fire' || first === 'weeks_on_fire') return `/${first}`;
  return '';
}

export const crewMembers: CrewMember[] = crewRecords.map((member) => ({
  id: member.id,
  name: member.name,
  role: member.role,
  location: member.location,
  yearsOnSeries: member.yearsOnSeries,
  specialty: member.specialty,
  bio: member.bio,
  quote: member.quote,
  credits: member.credits,
  imageUrl: `${sitePrefix()}/cast/${member.imageFile}`,
}));
