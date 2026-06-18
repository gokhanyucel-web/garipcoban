import React from 'react';
import { CuratedList } from '../types';
import Byline from './Byline';

interface Props {
  lists: CuratedList[];
  onOpenList: (list: CuratedList) => void;
  onSeeAll: () => void;
}

// "Featured Voices" — a horizontal strip of curator-published lists shown
// at the top of the Archive (home) view. Hidden when there are no curators.
const VoicesStrip: React.FC<Props> = ({ lists, onOpenList, onSeeAll }) => {
  if (!lists.length) return null;
  const featured = lists.slice(0, 8);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 bg-black"></div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest">Featured Voices</h2>
        </div>
        <button
          onClick={onSeeAll}
          className="bg-black text-[#F5C71A] px-4 py-2 font-black uppercase text-xs hover:scale-105 transition-transform"
        >
          All Critics →
        </button>
      </div>
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
        {featured.map((list) => (
          <div
            key={list.id}
            onClick={() => onOpenList(list)}
            className="min-w-[240px] max-w-[240px] flex flex-col cursor-pointer border-4 border-black p-5 bg-black text-[#F5C71A] shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)] hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all"
          >
            <h3 className="text-xl font-black uppercase leading-none mb-2">{list.title}</h3>
            <p className="text-xs font-bold uppercase opacity-70 mb-4">{list.subtitle}</p>
            <div className="mt-auto pt-3 border-t border-[#F5C71A]/30">
              <Byline list={list} className="opacity-90" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VoicesStrip;
