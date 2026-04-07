import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PLACE_ALERT_LABELS, PLACE_ALERT_OPTIONS } from '../constants/place';
import { Place, PlaceAlert } from '../store/slices/placesSlice';

interface PlaceAlertsPanelProps {
  place: Place;
  canReport: boolean;
  canResolve: boolean;
  onReportAlert: (payload: { alertType: string; message: string }) => Promise<void>;
  onResolveAlert: (alertId: string) => Promise<void>;
}

const PlaceAlertsPanel: React.FC<PlaceAlertsPanelProps> = ({
  place,
  canReport,
  canResolve,
  onReportAlert,
  onResolveAlert,
}) => {
  const [alertType, setAlertType] = useState<string>('lift-outage');
  const [message, setMessage] = useState('');

  const { activeAlerts, resolvedAlerts } = useMemo(
    () =>
      place.alerts.reduce(
        (groups, alert) => {
          if (alert.status === 'resolved') {
            groups.resolvedAlerts.push(alert);
          } else {
            groups.activeAlerts.push(alert);
          }

          return groups;
        },
        { activeAlerts: [] as PlaceAlert[], resolvedAlerts: [] as PlaceAlert[] }
      ),
    [place.alerts]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onReportAlert({ alertType, message });
    setAlertType('lift-outage');
    setMessage('');
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-amber-600" size={20} />
        <h2 className="text-2xl font-semibold text-slate-900">
          Live accessibility alerts
        </h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Real-time reports keep accessibility data practical for the next visitor.
      </p>

      <div className="mt-6 space-y-4">
        {activeAlerts.length > 0 ? (
          activeAlerts.map((alert) => (
            <div
              key={alert._id}
              className="rounded-3xl border border-amber-200 bg-amber-50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-amber-900">
                    {PLACE_ALERT_LABELS[alert.alertType] || 'Accessibility issue'}
                  </div>
                  <div className="mt-1 text-xs text-amber-800">
                    Reported by{' '}
                    {typeof alert.user === 'string' ? 'community member' : alert.user.name}{' '}
                    on {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>
                {canResolve && alert._id && (
                  <button
                    type="button"
                    onClick={() => onResolveAlert(alert._id!)}
                    className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-amber-800"
                  >
                    Mark resolved
                  </button>
                )}
              </div>
              {alert.message && (
                <p className="mt-3 text-sm leading-6 text-amber-950">{alert.message}</p>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            No active accessibility alerts have been reported for this place.
          </div>
        )}
      </div>

      {canReport && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-3xl bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Report a current issue</h3>
          <div className="mt-4 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Issue type</span>
              <select
                value={alertType}
                onChange={(event) => setAlertType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                {PLACE_ALERT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">What is happening?</span>
              <textarea
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Example: Lift near the main entrance has been offline since this morning."
              />
            </label>

            <button
              type="submit"
              className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Report alert
            </button>
          </div>
        </form>
      )}

      {resolvedAlerts.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CheckCircle2 size={16} />
            Resolved alerts
          </div>
          <div className="mt-3 space-y-3">
            {resolvedAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
              >
                <div className="font-medium text-slate-900">
                  {PLACE_ALERT_LABELS[alert.alertType] || 'Accessibility issue'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Resolved{' '}
                  {alert.resolvedAt
                    ? new Date(alert.resolvedAt).toLocaleString()
                    : 'recently'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default PlaceAlertsPanel;
