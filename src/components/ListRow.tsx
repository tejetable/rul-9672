import type { ReactNode } from 'react';
import { Button } from './ui/button';

type ListRowProps = {
  leading?: ReactNode;
  name: string;
  subtitle?: string | undefined;
  chip?: string | undefined;
  date?: string;
  dateTime?: string;
  status?: 'active' | 'pending' | 'off';
  statusLabel?: string;
  onClick?: () => void;
};

export function ListCard({ children, label, className = '' }: { children: ReactNode; label?: string; className?: string }) {
  return <ul aria-label={label} className={`club-list-card ${className}`}>{children}</ul>;
}

export function ListRow({ leading, name, subtitle, chip, date, dateTime, status, statusLabel, onClick }: ListRowProps) {
  const content = <>
    <span className="list-row-leading" aria-hidden={typeof leading === 'string' ? undefined : true}>{leading}</span>
    <span className="list-row-text">
      <span className="list-row-name-line"><strong className="list-row-name" title={name}>{name}</strong>{chip && <span className="list-row-chip">{chip}</span>}</span>
      <span className="list-row-subtitle" title={subtitle}>{subtitle || '\u00a0'}</span>
    </span>
    <span className="list-row-meta">{date && <time dateTime={dateTime}>{date}</time>}{status && <span role="img" aria-label={statusLabel || (status === 'active' ? 'Activa' : status === 'pending' ? 'Sin acceder' : 'Baja')} className={`list-row-status list-row-status-${status}`} />}</span>
  </>;
  return <li className="club-list-item">{onClick ? <Button variant="ghost" className="club-list-row" onClick={onClick}>{content}</Button> : <div className="club-list-row">{content}</div>}</li>;
}