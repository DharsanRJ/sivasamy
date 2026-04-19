import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group text-[13px] font-medium",
      active ? "bg-brand-accent text-brand-bg shadow-lg shadow-brand-accent/20" : "text-brand-muted hover:text-brand-text hover:bg-brand-surface"
    )}
  >
    <Icon size={16} className={cn(active ? "text-brand-bg" : "text-brand-muted group-hover:text-brand-text")} />
    <span>{label}</span>
  </button>
);

export const SectionHeader = ({ title, description }: { title: string, description?: string }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold tracking-tight text-brand-text">{title}</h1>
    {description && <p className="text-brand-muted mt-1 text-sm">{description}</p>}
  </div>
);
