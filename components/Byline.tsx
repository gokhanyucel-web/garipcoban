import React from 'react';
import { CuratedList } from '../types';

// Renders "by {author} ✓" — the ✓ only for verified curators/admins.
// Reused by the Voices strip, the Critics view, and the list-detail header.
const Byline: React.FC<{ list: CuratedList; className?: string; onClick?: () => void }> = ({ list, className = '', onClick }) => {
  const author = list.author || list.authorUsername;
  if (!author) return null;
  const verified = list.authorRole === 'curator' || list.authorRole === 'admin';
  return (
    <span
      onClick={onClick}
      className={`font-mono text-xs uppercase tracking-widest ${onClick ? 'cursor-pointer hover:underline' : ''} ${className}`}
    >
      by {author}{verified && <span title="Verified curator" className="ml-1 font-black">✓</span>}
    </span>
  );
};

export default Byline;
