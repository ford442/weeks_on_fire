import { Link } from 'react-router-dom';

import { songs } from '../data/songs';

import EggTable from './EggTable';
import { recipes } from './recipes';

const songTitle = (id: string) => songs.find((s) => s.id === id)?.title;

export default function Recipes() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
        Six-C, the kitchen side
      </p>
      <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Lillith’s Recipes</h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-300">
        Real food. Tested on a two-burner stove and one folding table in the laundry room. The
        safety glasses were in her hair the whole time.
      </p>

      <section aria-labelledby="egg-table" className="mt-10">
        <h2 id="egg-table" className="mb-3 text-xl font-bold text-white">
          The egg table
        </h2>
        <EggTable />
      </section>

      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {recipes.map((r) => {
          const title = r.songId ? songTitle(r.songId) : undefined;
          return (
            <li key={r.id} id={r.id} className="rounded-xl border border-zinc-900 bg-zinc-950 p-5">
              <h2 className="text-xl font-bold text-white">{r.title}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Serves {r.serves} · {r.time}
              </p>
              <h3 className="mt-4 text-sm font-semibold text-fuchsia-300">You need</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-zinc-300">
                {r.ingredients.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <h3 className="mt-4 text-sm font-semibold text-fuchsia-300">Then</h3>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-zinc-300">
                {r.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="mt-4 border-l-2 border-orange-400/60 pl-3 text-sm italic text-orange-100">
                {r.note}
              </p>
              {title && (
                <Link
                  to={`/listen/${r.songId}`}
                  className="mt-3 inline-block text-xs text-zinc-400 underline-offset-2 hover:text-white hover:underline"
                >
                  Cook to: {title} →
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
