import React from 'react';

export type DocCardItem = {
  href: string;
  title: string;
  description?: string;
};

export type DocCardsProps = {
  items: DocCardItem[];
  variant?: 'default' | 'compact';
};

export function DocCards(props: DocCardsProps) {
  const { items, variant = 'default' } = props;
  const cardClassName =
    variant === 'compact' ? 'layoutCard layoutCard--compact' : 'layoutCard';

  return (
    <div className="layoutIntroCards">
      {items.map((item) => (
        <a key={item.href} className={cardClassName} href={item.href}>
          <div className="layoutCardTitle">{item.title}</div>
          {item.description ? (
            <div className="layoutCardDesc">{item.description}</div>
          ) : null}
        </a>
      ))}
    </div>
  );
}

export default function DocCardsPage() {
  return (
    <DocCards
      items={[
        { href: '/guide/start/introduction', title: 'Start', description: 'Docs entry.' },
      ]}
    />
  );
}
