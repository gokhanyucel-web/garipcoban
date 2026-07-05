import React from 'react';
import { CuratedList } from '../types';
import Byline from './Byline';
import { onActivateKey } from './keyboard';

interface Props {
  list: CuratedList;
  onOpen: (list: CuratedList) => void;
  showByline?: boolean;
  className?: string;
  children?: React.ReactNode; // e.g. an absolute-positioned saved/+ overlay button
}

// The standard brutalist journey card, shared by the Archive grid, the Critics
// view, and curator profiles. role="button" + keydown makes it keyboard-operable
// (a plain <button> can't wrap the Archive card's nested vault button).
const ListCard: React.FC<Props> = ({ list, onOpen, showByline, className = '', children }) => {
  const filmCount = list.tiers.reduce((acc, t) => acc + t.films.length, 0);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(list)}
      onKeyDown={onActivateKey(() => onOpen(list))}
      className={`group relative flex flex-col text-left cursor-pointer border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#F5C71A] text-black hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#F5C71A] transition-all duration-200 ${className}`}
    >
      {children}
      <h3 className="text-2xl font-black uppercase leading-none mb-2 mt-2 pr-8">{list.title}</h3>
      <p className="text-sm font-bold uppercase opacity-80 mb-4">{list.subtitle}</p>
      {showByline && <Byline list={list} className="block mb-3" />}
      <div className="mt-auto border-t-2 border-current pt-2 flex justify-between items-center opacity-60 text-[10px] font-mono">
        <span>{list.tiers.length} Tiers</span>
        <span>{filmCount} Films</span>
      </div>
    </div>
  );
};

export default ListCard;
