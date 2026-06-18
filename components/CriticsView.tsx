import React from 'react';
import { CuratedList } from '../types';

interface Props {
  lists: CuratedList[];
  onOpenList: (list: CuratedList) => void;
  onOpenCurator: (username: string) => void;
}

interface CuratorGroup {
  name: string;
  username?: string;
  avatar?: string;
  lists: CuratedList[];
}

// The "Critics" tab: curator-published lists grouped by their author.
const CriticsView: React.FC<Props> = ({ lists, onOpenList, onOpenCurator }) => {
  const byCurator = new Map<string, CuratorGroup>();
  lists.forEach((l) => {
    const key = l.authorUsername || l.author || 'Curator';
    if (!byCurator.has(key)) {
      byCurator.set(key, { name: l.author || key, username: l.authorUsername, avatar: l.authorAvatar, lists: [] });
    }
    byCurator.get(key)!.lists.push(l);
  });
  const curators = Array.from(byCurator.values());

  if (!curators.length) {
    return (
      <div className="animate-fadeIn py-24 text-center">
        <h2 className="text-3xl font-black uppercase mb-3">No Critics Yet</h2>
        <p className="font-mono text-sm opacity-60 max-w-md mx-auto">
          Curated journeys from invited critics appear here once they publish their first list.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-16">
      {curators.map((c) => (
        <section key={c.username || c.name} className="space-y-6">
          <div className="flex items-center gap-4 border-b-4 border-black pb-3">
            <div className="w-14 h-14 bg-black text-[#F5C71A] flex items-center justify-center border-2 border-black overflow-hidden flex-shrink-0">
              {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" /> : <span className="font-black text-xl">{(c.name || '?').charAt(0).toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => c.username && onOpenCurator(c.username)}
                className="text-2xl md:text-3xl font-black uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                {c.name} <span title="Verified curator">✓</span>
              </button>
              <p className="font-mono text-xs opacity-60 uppercase tracking-widest">
                {c.lists.length} curated {c.lists.length === 1 ? 'journey' : 'journeys'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.lists.map((list) => (
              <div
                key={list.id}
                onClick={() => onOpenList(list)}
                className="group relative flex flex-col text-left cursor-pointer border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#F5C71A] text-black hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#F5C71A] transition-all duration-200"
              >
                <h3 className="text-2xl font-black uppercase leading-none mb-2">{list.title}</h3>
                <p className="text-sm font-bold uppercase opacity-80 mb-4">{list.subtitle}</p>
                <div className="mt-auto border-t-2 border-current pt-2 flex justify-between items-center opacity-60 text-[10px] font-mono">
                  <span>{list.tiers.length} Tiers</span>
                  <span>{list.tiers.reduce((acc, t) => acc + t.films.length, 0)} Films</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default CriticsView;
