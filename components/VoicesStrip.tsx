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
            className="min-w-[240px] max-w-[240px] flex flex-col cursor-pointer border-4 border-black p-5 bg-[#F5C71A] text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#F5C71A] transition-all duration-200"
          >
            <h3 className="text-xl font-black uppercase leading-none mb-2">{list.title}</h3>
            <p className="text-sm font-bold uppercase opacity-80 mb-4">{list.subtitle}</p>
            <div className="mt-auto pt-3 border-t-2 border-current">
              <Byline list={list} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VoicesStrip;
