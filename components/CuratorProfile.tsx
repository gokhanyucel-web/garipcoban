import React from 'react';
import { CuratedList } from '../types';
import ListCard from './ListCard';

interface Props {
  username: string;
  lists: CuratedList[]; // all external lists; filtered by username here
  onOpenList: (list: CuratedList) => void;
  onBack: () => void;
}

// A curator's public "space": their identity + the journeys they've published.
const CuratorProfile: React.FC<Props> = ({ username, lists, onOpenList, onBack }) => {
  const theirs = lists.filter((l) => (l.authorUsername || l.author) === username);
  const identity = theirs[0];
  const name = identity?.author || username;
  const avatar = identity?.authorAvatar;

  return (
    <div className="min-h-screen w-full bg-[#F5C71A] text-black pb-20 overflow-x-hidden">
      <nav className="px-6 py-4">
        <button
          onClick={onBack}
          className="bg-[#F5C71A] border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider text-sm hover:bg-black hover:text-[#F5C71A] transition-colors"
        >
          ← Back
        </button>
      </nav>

      <header className="max-w-5xl mx-auto px-6 pt-8 pb-12 flex items-center gap-6 border-b-4 border-black">
        <div className="w-24 h-24 bg-black text-[#F5C71A] flex items-center justify-center border-4 border-black overflow-hidden flex-shrink-0">
          {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <span className="font-black text-4xl">{name.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">{name}</h1>
            <span title="Verified curator" className="text-2xl">✓</span>
          </div>
          <p className="font-mono text-sm uppercase tracking-widest opacity-60 mt-2">
            Verified Critic · {theirs.length} curated {theirs.length === 1 ? 'journey' : 'journeys'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        {theirs.length === 0 ? (
          <p className="font-mono opacity-60">No published journeys yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {theirs.map((list) => (
              <ListCard key={list.id} list={list} onOpen={onOpenList} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CuratorProfile;
