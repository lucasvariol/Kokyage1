'use client';

import { useState, useEffect } from 'react';

export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Espace en haut pour le header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Mettre à jour l'URL sans recharger
      window.history.pushState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  if (!headings || headings.length === 0) return null;

  return (
    <nav className="table-of-contents">
      <h3>Sommaire</h3>
      <ul>
        {headings.map(({ text, id }) => (
          <li key={id} className={activeId === id ? 'active' : ''}>
            <a 
              href={`#${id}`}
              onClick={(e) => handleClick(e, id)}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
