import React from 'react';

type ReservationLikeStatus =
  | 'received'
  | 'confirmed'
  | 'declined'
  | 'cancelled'
  | 'completed'
  | 'not-required';

interface ReservationStatusBadgeProps {
  status: ReservationLikeStatus;
  label?: string;
}

const STATUS_STYLES: Record<ReservationLikeStatus, string> = {
  received: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-200 text-slate-700',
  completed: 'bg-blue-100 text-blue-800',
  'not-required': 'bg-slate-100 text-slate-700',
};

const formatStatusLabel = (status: ReservationLikeStatus) =>
  status.replace('-', ' ');

const ReservationStatusBadge: React.FC<ReservationStatusBadgeProps> = ({
  status,
  label,
}) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
  >
    {label || formatStatusLabel(status)}
  </span>
);

export default ReservationStatusBadge;
