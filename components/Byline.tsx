import React from 'react';
import { CuratedList } from '../types';
import { onActivateKey } from './keyboard';

// Renders "by {author} ✓" — the ✓ (verified curator/admin) is decorative, with a
// screen-reader-only label. When onClick is given it becomes keyboard-operable.
const Byline: React.FC<{ list: CuratedList; className?: string; onClick?: () => void }> = ({ list, className = '', onClick }) => {
  const author = list.author || list.authorUsername;
  if (!author) return null;
  const verified = list.authorRole === 'curator' || list.authorRole === 'admin';

  const content = (
    <>
      by {author}
      {verified && (
        <>
          <span className="sr-only"> (verified curator)</span>
          <span aria-hidden="true" className="ml-1 font-black">✓</span>
        </>
      )}
    </>
  );

  const base = `font-mono text-xs uppercase tracking-widest ${className}`;

  if (onClick) {
    return (
      <span role="button" tabIndex={0} onClick={onClick} onKeyDown={onActivateKey(onClick)} className={`${base} cursor-pointer hover:underline`}>
        {content}
      </span>
    );
  }
  return <span className={base}>{content}</span>;
};

export default Byline;
