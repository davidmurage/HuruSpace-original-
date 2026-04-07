import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LiveRefreshStatusProps {
  title: string;
  description: string;
  isRefreshing: boolean;
  lastRefreshError?: string | null;
  lastUpdatedAt: Date | null;
  onRefresh: () => Promise<unknown> | unknown;
}

const formatRefreshTime = (value: Date | null) => {
  if (!value) {
    return 'Waiting for the next refresh';
  }

  return `Last updated at ${value.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const LiveRefreshStatus: React.FC<LiveRefreshStatusProps> = ({
  title,
  description,
  isRefreshing,
  lastRefreshError,
  lastUpdatedAt,
  onRefresh,
}) => (
  <section
    aria-live="polite"
    className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm"
  >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-emerald-900">{description}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">
          {isRefreshing ? 'Checking for updates...' : formatRefreshTime(lastUpdatedAt)}
        </p>
        {lastRefreshError && (
          <p className="mt-2 text-sm font-medium text-red-700">
            Last refresh failed: {lastRefreshError}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => void onRefresh()}
        disabled={isRefreshing}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        Refresh now
      </button>
    </div>
  </section>
);

export default LiveRefreshStatus;
