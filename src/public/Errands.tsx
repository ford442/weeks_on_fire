import ErrandsGame from './ErrandsGame';
import { lines } from './errandsCopy';

export default function Errands() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
        {lines.eyebrow}
      </p>
      <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Errands</h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-300">{lines.intro}</p>
      <div className="mt-8">
        <ErrandsGame />
      </div>
    </div>
  );
}
