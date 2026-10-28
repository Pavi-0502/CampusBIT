import React from 'react';
import { AuctionStatus, ItemCondition, ItemCategory } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-brand-50 text-brand-700 border-brand-200',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    violet: 'bg-accent-50 text-accent-700 border-accent-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: AuctionStatus }> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>;
    case 'AWAITING_SELLER_DECISION':
      return <Badge variant="warning">Awaiting Seller Decision</Badge>;
    case 'RESERVED':
      return <Badge variant="violet">Reserved for Pickup</Badge>;
    case 'SOLD':
      return <Badge variant="primary">Sold & Handed Over</Badge>;
    case 'UNSOLD':
      return <Badge variant="secondary">Unsold</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Price Rejected</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const ConditionBadge: React.FC<{ condition: ItemCondition }> = ({ condition }) => {
  switch (condition) {
    case 'Like New':
      return <Badge variant="success">Like New</Badge>;
    case 'Good':
      return <Badge variant="primary">Good Condition</Badge>;
    case 'Fair':
      return <Badge variant="warning">Fair Condition</Badge>;
    case 'Needs Repair':
      return <Badge variant="danger">Needs Repair</Badge>;
    default:
      return <Badge variant="neutral">{condition}</Badge>;
  }
};
