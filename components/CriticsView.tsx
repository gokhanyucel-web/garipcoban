import React from 'react';
import { CuratedList } from '../types';
import ListCard from './ListCard';

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
              <ListCard key={list.id} list={list} onOpen={onOpenList} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default CriticsView;
