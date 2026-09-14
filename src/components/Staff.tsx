import { useState } from 'react';
import { Quote, Users } from 'lucide-react';
import { staffMembers, type StaffMember } from '../data/staff';
import { firstCatalogItem } from '../lib/catalog';

export default function Staff() {
  const [selected, setSelected] = useState<StaffMember>(firstCatalogItem(staffMembers, 'staff'));

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
      <div className="space-y-5">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 shrink-0 text-orange-300" size={18} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-zinc-200">Fictional series crew</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Made-up credits for Weeks on Fire — writer, producer, director, and the people who
                keep the music and stills in sync. Select a name to read the full bio and quote.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {staffMembers.map((member) => {
            const isActive = selected.id === member.id;

            return (
              <article
                key={member.id}
                className={`overflow-hidden rounded-lg border bg-zinc-950 transition hover:-translate-y-0.5 ${
                  isActive
                    ? 'border-orange-500/70 ring-1 ring-orange-500/40'
                    : 'border-zinc-800 hover:border-orange-500/70'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelected(member)}
                  className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-300"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-zinc-900">
                    <img
                      src={member.imageUrl}
                      alt={`${member.name} — ${member.role}`}
                      className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                      {member.role}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">
                      {member.name}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">{member.specialty}</p>
                    <blockquote className="mt-4 border-l-2 border-orange-500/50 pl-3 text-sm leading-6 text-zinc-300 line-clamp-3">
                      “{member.quote}”
                    </blockquote>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-400">
          <Quote size={17} aria-hidden="true" />
          Crew Profile
        </div>
        <StaffDetail member={selected} />
      </aside>
    </section>
  );
}

function StaffDetail({ member }: { member: StaffMember }) {
  return (
    <div className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-zinc-900">
        <img
          src={member.imageUrl}
          alt={`${member.name} — ${member.role}`}
          className="h-full w-full object-cover object-top"
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
          {member.role}
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight text-white">{member.name}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {member.location} · {member.yearsOnSeries}
        </p>
      </div>

      <div className="rounded-md border border-orange-500/20 bg-orange-500/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-200">Quote</p>
        <blockquote className="mt-2 text-base leading-7 text-zinc-100">“{member.quote}”</blockquote>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Bio</p>
        <p className="mt-2 text-sm leading-7 text-zinc-300">{member.bio}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Specialty</p>
        <p className="mt-2 text-sm text-zinc-300">{member.specialty}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Series credits
        </p>
        <ul className="mt-2 space-y-2">
          {member.credits.map((credit) => (
            <li
              key={credit}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
            >
              {credit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
