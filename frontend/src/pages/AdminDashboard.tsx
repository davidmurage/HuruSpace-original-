import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  CarFront,
  DownloadCloud,
  ExternalLink,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import PlaceForm from '../components/PlaceForm';
import ReservationStatusBadge from '../components/ReservationStatusBadge';
import { PLACE_TYPES } from '../constants/accessibility';
import {
  createPlace,
  deletePlace,
  fetchPlaces,
  Place,
  PlaceSyncPreviewResult,
  PlaceSyncResult,
  previewPlaceSync,
  syncPlacesFromInternet,
  updatePlace,
} from '../store/slices/placesSlice';
import {
  fetchManagedReservations,
  fetchRideRequests,
  respondToReservation,
  respondToRideRequest,
} from '../store/slices/reservationsSlice';
import { RootState, AppDispatch } from '../store/store';

type AdminTab = 'places' | 'reservations' | 'transport';

interface PaginationResult<T> {
  items: T[];
  totalPages: number;
  currentPage: number;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 6;
const SYNC_ACTION_LABELS = {
  new: 'New place',
  update: 'Update existing',
  skip: 'No change',
} as const;
const SYNC_ACTION_STYLES = {
  new: 'bg-emerald-100 text-emerald-800',
  update: 'bg-amber-100 text-amber-800',
  skip: 'bg-slate-100 text-slate-700',
} as const;
const SYNC_DATA_POINT_LABELS: Record<string, string> = {
  description: 'Description',
  phone: 'Phone',
  email: 'Email',
};

const formatReservationDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const paginateItems = <T,>(items: T[], page: number): PaginationResult<T> => {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  return {
    items: items.slice(startIndex, startIndex + PAGE_SIZE),
    totalPages,
    currentPage,
  };
};

const buildVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index
  );
};

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = buildVisiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
      <p className="text-sm text-slate-600">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { places, isLoading, error } = useSelector((state: RootState) => state.places);
  const {
    managedReservations,
    transportReservations,
    isManaging,
    isTransportLoading,
    managementError,
    transportError,
  } = useSelector((state: RootState) => state.reservations);
  const [activeTab, setActiveTab] = useState<AdminTab>('places');
  const [showForm, setShowForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [syncForm, setSyncForm] = useState({
    searchArea: '',
    type: 'all',
    radiusKm: 5,
  });
  const [syncResult, setSyncResult] = useState<PlaceSyncResult | null>(null);
  const [syncPreview, setSyncPreview] = useState<PlaceSyncPreviewResult | null>(null);
  const [syncError, setSyncError] = useState('');
  const [syncMode, setSyncMode] = useState<'preview' | 'import' | null>(null);
  const [adminStatusMessage, setAdminStatusMessage] = useState('');
  const [ownerResponseDrafts, setOwnerResponseDrafts] = useState<Record<string, string>>(
    {}
  );
  const [rideResponseDrafts, setRideResponseDrafts] = useState<Record<string, string>>({});
  const [providerNames, setProviderNames] = useState<Record<string, string>>({});
  const [driverNames, setDriverNames] = useState<Record<string, string>>({});
  const [driverPhones, setDriverPhones] = useState<Record<string, string>>({});
  const [vehicleDetails, setVehicleDetails] = useState<Record<string, string>>({});
  const [vehicleAccessibility, setVehicleAccessibility] = useState<Record<string, string>>({});
  const [placesPage, setPlacesPage] = useState(1);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [transportPage, setTransportPage] = useState(1);
  const [syncPreviewPage, setSyncPreviewPage] = useState(1);

  useEffect(() => {
    dispatch(fetchPlaces());
    dispatch(fetchManagedReservations());
    dispatch(fetchRideRequests());
  }, [dispatch]);

  const closeForm = () => {
    setShowForm(false);
    setEditingPlace(null);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      if (editingPlace) {
        await dispatch(
          updatePlace({ id: editingPlace._id, placeData: formData })
        ).unwrap();
        setAdminStatusMessage('Place updated.');
      } else {
        await dispatch(createPlace(formData)).unwrap();
        setAdminStatusMessage('Place added.');
      }
      closeForm();
    } catch {
      setAdminStatusMessage('Unable to save that place right now.');
    }
  };

  const handleDelete = async (placeId: string) => {
    if (window.confirm('Delete this place entry?')) {
      try {
        await dispatch(deletePlace(placeId)).unwrap();
        setAdminStatusMessage('Place deleted.');
      } catch {
        setAdminStatusMessage('Unable to delete that place right now.');
      }
    }
  };

  const runSyncPreview = async () => {
    setSyncError('');
    setAdminStatusMessage('');
    setSyncMode('preview');

    try {
      const result = await dispatch(previewPlaceSync(syncForm)).unwrap();
      setSyncPreview(result);
      setSyncPreviewPage(1);
      setAdminStatusMessage(result.message);
    } catch (syncFailure) {
      setSyncResult(null);
      setSyncPreview(null);
      setSyncError(
        syncFailure instanceof Error
          ? syncFailure.message
          : 'Internet sync could not complete right now.'
      );
    } finally {
      setSyncMode(null);
    }
  };

  const runSyncImport = async () => {
    setSyncError('');
    setAdminStatusMessage('');
    setSyncMode('import');

    try {
      const result = await dispatch(syncPlacesFromInternet(syncForm)).unwrap();
      setSyncResult(result);
      setAdminStatusMessage(result.message);
    } catch (syncFailure) {
      setSyncResult(null);
      setSyncError(
        syncFailure instanceof Error
          ? syncFailure.message
          : 'Internet sync could not complete right now.'
      );
    } finally {
      setSyncMode(null);
    }
  };

  const handleSyncPlaces = async (event: React.FormEvent) => {
    event.preventDefault();
    await runSyncImport();
  };

  const reservationInbox = useMemo(
    () =>
      managedReservations
        .filter((reservation) => !['cancelled', 'completed'].includes(reservation.status))
        .sort(
          (left, right) =>
            new Date(left.reservationFor).getTime() -
            new Date(right.reservationFor).getTime()
        ),
    [managedReservations]
  );

  const rideQueue = useMemo(
    () =>
      transportReservations
        .filter((reservation) => reservation.ride.required)
        .sort(
          (left, right) =>
            new Date(left.ride.pickupTime || left.reservationFor).getTime() -
            new Date(right.ride.pickupTime || right.reservationFor).getTime()
        ),
    [transportReservations]
  );

  const paginatedPlaces = useMemo(
    () => paginateItems(places, placesPage),
    [places, placesPage]
  );
  const paginatedReservations = useMemo(
    () => paginateItems(reservationInbox, reservationsPage),
    [reservationInbox, reservationsPage]
  );
  const paginatedTransport = useMemo(
    () => paginateItems(rideQueue, transportPage),
    [rideQueue, transportPage]
  );
  const paginatedSyncPreview = useMemo(
    () =>
      syncPreview
        ? paginateItems(syncPreview.previewItems, syncPreviewPage)
        : { items: [], totalPages: 1, currentPage: 1 },
    [syncPreview, syncPreviewPage]
  );
  const syncPreviewPhotoSummary = useMemo(() => {
    if (!syncPreview) {
      return {
        totalIncomingImages: 0,
        totalImagesToImport: 0,
        placesWithImages: 0,
      };
    }

    return syncPreview.previewItems.reduce(
      (summary, item) => ({
        totalIncomingImages: summary.totalIncomingImages + item.incomingImageCount,
        totalImagesToImport: summary.totalImagesToImport + item.imagesToImportCount,
        placesWithImages:
          summary.placesWithImages + (item.incomingImageCount > 0 ? 1 : 0),
      }),
      {
        totalIncomingImages: 0,
        totalImagesToImport: 0,
        placesWithImages: 0,
      }
    );
  }, [syncPreview]);

  useEffect(() => {
    if (paginatedPlaces.currentPage !== placesPage) {
      setPlacesPage(paginatedPlaces.currentPage);
    }
  }, [paginatedPlaces.currentPage, placesPage]);

  useEffect(() => {
    if (paginatedReservations.currentPage !== reservationsPage) {
      setReservationsPage(paginatedReservations.currentPage);
    }
  }, [paginatedReservations.currentPage, reservationsPage]);

  useEffect(() => {
    if (paginatedTransport.currentPage !== transportPage) {
      setTransportPage(paginatedTransport.currentPage);
    }
  }, [paginatedTransport.currentPage, transportPage]);

  useEffect(() => {
    if (paginatedSyncPreview.currentPage !== syncPreviewPage) {
      setSyncPreviewPage(paginatedSyncPreview.currentPage);
    }
  }, [paginatedSyncPreview.currentPage, syncPreviewPage]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Admin access required
          </h1>
          <p className="mt-2 text-slate-600">
            Verified partners and admins can manage community submissions here.
          </p>
          <Link
            to="/places"
            className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Back to discovery
          </Link>
        </div>
      </div>
    );
  }

  const handleReservationResponse = async (
    reservationId: string,
    status: 'confirmed' | 'declined'
  ) => {
    try {
      await dispatch(
        respondToReservation({
          reservationId,
          status,
          message: ownerResponseDrafts[reservationId] || '',
        })
      ).unwrap();

      setOwnerResponseDrafts((current) => ({
        ...current,
        [reservationId]: '',
      }));
      setAdminStatusMessage('Reservation response sent.');
    } catch {
      setAdminStatusMessage('Unable to send that reservation response right now.');
    }
  };

  const handleRideResponse = async (
    reservationId: string,
    status: 'confirmed' | 'declined' | 'completed',
    fallbackProvider: string
  ) => {
    try {
      await dispatch(
        respondToRideRequest({
          reservationId,
          status,
          message: rideResponseDrafts[reservationId] || '',
          providerName: providerNames[reservationId] || fallbackProvider,
          vehicleAccessibility: (vehicleAccessibility[reservationId] || '')
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean),
          driverName: driverNames[reservationId] || '',
          driverPhone: driverPhones[reservationId] || '',
          vehicleDetails: vehicleDetails[reservationId] || '',
        })
      ).unwrap();

      setRideResponseDrafts((current) => ({
        ...current,
        [reservationId]: '',
      }));
      setAdminStatusMessage('Ride response sent.');
    } catch {
      setAdminStatusMessage('Unable to update that ride request right now.');
    }
  };

  const tabs: Array<{ id: AdminTab; label: string; count: number }> = [
    { id: 'places', label: 'Places', count: places.length },
    { id: 'reservations', label: 'Reservations', count: reservationInbox.length },
    { id: 'transport', label: 'Transport', count: rideQueue.length },
  ];

  return (
    <div className="bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin workspace</h1>
            <p className="mt-2 text-slate-600">
              Manage places, reservations, and transport confirmations from one organized workspace.
            </p>
          </div>
          {activeTab === 'places' && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus size={18} />
              Add place
            </button>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {adminStatusMessage && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {adminStatusMessage}
          </div>
        )}

        {activeTab === 'places' && (
          <>
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <DownloadCloud size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Sync qualifying places from the internet
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Search OpenStreetMap around a location, then import only supported place types that already have accessibility signals.
                  </p>

                  <form
                    className="mt-5 grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.7fr_auto_auto]"
                    onSubmit={handleSyncPlaces}
                  >
                    <input
                      value={syncForm.searchArea}
                      onChange={(event) =>
                        setSyncForm((current) => ({
                          ...current,
                          searchArea: event.target.value,
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="Search area, city, or neighborhood"
                      required
                    />
                    <select
                      value={syncForm.type}
                      onChange={(event) =>
                        setSyncForm((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3 capitalize"
                    >
                      <option value="all">All supported types</option>
                      {PLACE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={syncForm.radiusKm}
                      onChange={(event) =>
                        setSyncForm((current) => ({
                          ...current,
                          radiusKm: Number(event.target.value) || 5,
                        }))
                      }
                      className="rounded-2xl border border-slate-200 px-4 py-3"
                      placeholder="Radius km"
                    />
                    <button
                      type="button"
                      onClick={() => void runSyncPreview()}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Eye size={16} />
                      {syncMode === 'preview' && isLoading ? 'Previewing...' : 'Preview sync'}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {syncMode === 'import' && isLoading ? 'Importing...' : 'Import places'}
                    </button>
                  </form>

                  {syncError && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {syncError}
                    </div>
                  )}

                  {syncResult && (
                    <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                      <p className="text-sm font-semibold text-emerald-900">
                        {syncResult.message}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          Imported:{' '}
                          <span className="font-semibold">
                            {syncResult.importedPlaces.length}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          Existing updated:{' '}
                          <span className="font-semibold">
                            {syncResult.updatedPlaces?.length || 0}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          Duplicate skips:{' '}
                          <span className="font-semibold">
                            {syncResult.skippedDuplicates}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          Missing accessibility:{' '}
                          <span className="font-semibold">
                            {syncResult.skippedMissingAccessibility}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          Raw results scanned:{' '}
                          <span className="font-semibold">{syncResult.totalResults}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {syncPreview && (
                    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {syncPreview.message}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Previewed places are grouped by what Huruspaces would do and how many public photos would be added.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void runSyncImport()}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {syncMode === 'import' && isLoading
                            ? 'Importing...'
                            : 'Import these places'}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          New places:{' '}
                          <span className="font-semibold">{syncPreview.newPlacesCount}</span>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          Existing to update:{' '}
                          <span className="font-semibold">
                            {syncPreview.placesToUpdateCount}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          Public photos found:{' '}
                          <span className="font-semibold">
                            {syncPreviewPhotoSummary.totalIncomingImages}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          New photos to import:{' '}
                          <span className="font-semibold">
                            {syncPreviewPhotoSummary.totalImagesToImport}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                          Places with photos:{' '}
                          <span className="font-semibold">
                            {syncPreviewPhotoSummary.placesWithImages}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                        <table className="min-w-[1120px] divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Place
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Action
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Photos
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Preview
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {paginatedSyncPreview.items.length > 0 ? (
                              paginatedSyncPreview.items.map((item) => (
                                <tr key={item.externalId}>
                                  <td className="px-6 py-4 align-top">
                                    <div className="font-semibold text-slate-900">
                                      {item.name}
                                    </div>
                                    <div className="mt-1 text-sm capitalize text-slate-500">
                                      {item.type.replace('-', ' ')}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600">
                                      {item.address}
                                    </div>
                                    {item.sourceUrl && (
                                      <a
                                        href={item.sourceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
                                      >
                                        View source
                                        <ExternalLink size={14} />
                                      </a>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 align-top">
                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                        SYNC_ACTION_STYLES[item.action]
                                      }`}
                                    >
                                      {SYNC_ACTION_LABELS[item.action]}
                                    </span>
                                    <div className="mt-3 text-sm text-slate-600">
                                      Accessibility score: {item.accessibilityScore}/100
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 align-top text-sm text-slate-700">
                                    <div>Found online: {item.incomingImageCount}</div>
                                    <div className="mt-1 font-medium text-slate-900">
                                      New to import: {item.imagesToImportCount}
                                    </div>
                                    <div className="mt-1 text-slate-500">
                                      After sync: {item.totalImageCountAfterSync}
                                    </div>
                                    {item.existingPlace && (
                                      <div className="mt-1 text-slate-500">
                                        Existing now: {item.existingImageCount}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 align-top">
                                    {item.previewImages.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {item.previewImages.slice(0, 4).map((image, index) => (
                                          <img
                                            key={`${item.externalId}-preview-${index}`}
                                            src={image}
                                            alt={`${item.name} preview ${index + 1}`}
                                            className="h-16 w-20 rounded-2xl object-cover"
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-slate-500">
                                        No new preview images available.
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 align-top text-sm text-slate-700">
                                    {item.existingPlace ? (
                                      <div>
                                        Matches existing place:{' '}
                                        <span className="font-medium text-slate-900">
                                          {item.existingPlace.name}
                                        </span>
                                      </div>
                                    ) : (
                                      <div>Will be added as a new place.</div>
                                    )}
                                    {item.addedDataPoints.length > 0 && (
                                      <div className="mt-2 text-slate-600">
                                        Also fills:{' '}
                                        {item.addedDataPoints
                                          .map(
                                            (entry) =>
                                              SYNC_DATA_POINT_LABELS[entry] || entry
                                          )
                                          .join(', ')}
                                      </div>
                                    )}
                                    {item.action === 'skip' && (
                                      <div className="mt-2 text-slate-500">
                                        This place already looks up to date for the current sync.
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-6 py-10 text-center text-sm text-slate-500"
                                >
                                  No qualifying places are available in this preview.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <PaginationControls
                        currentPage={paginatedSyncPreview.currentPage}
                        totalPages={paginatedSyncPreview.totalPages}
                        onPageChange={setSyncPreviewPage}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-semibold text-slate-900">Places</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Community and imported places with verification and score details.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Place
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedPlaces.items.length > 0 ? (
                      paginatedPlaces.items.map((place) => (
                        <tr key={place._id}>
                          <td className="px-6 py-4 align-top">
                            <div>
                              <div className="font-semibold text-slate-900">{place.name}</div>
                              <div className="text-sm text-slate-500">{place.address}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top text-sm capitalize text-slate-700">
                            {place.type.replace('-', ' ')}
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            {place.source?.kind === 'internet-sync'
                              ? 'Internet sync'
                              : 'Community'}
                          </td>
                          <td className="px-6 py-4 align-top text-sm font-semibold text-slate-900">
                            {place.accessibilityScore}/100
                          </td>
                          <td className="px-6 py-4 align-top">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                place.verificationStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              <BadgeCheck size={13} />
                              {place.verificationStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setEditingPlace(place)}
                                className="rounded-full border border-slate-200 p-2 text-slate-600"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(place._id)}
                                className="rounded-full border border-red-200 p-2 text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-10 text-center text-sm text-slate-500"
                        >
                          {isLoading ? 'Loading places...' : 'No places available yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                currentPage={paginatedPlaces.currentPage}
                totalPages={paginatedPlaces.totalPages}
                onPageChange={setPlacesPage}
              />
            </section>
          </>
        )}

        {activeTab === 'reservations' && (
          <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">Reservations</h2>
              <p className="mt-1 text-sm text-slate-600">
                Confirm or decline reservations for places under your management.
              </p>
            </div>

            {managementError && (
              <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
                {managementError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-[1100px] divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Place
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current Reply
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedReservations.items.length > 0 ? (
                    paginatedReservations.items.map((reservation) => {
                      const bookedBy =
                        !reservation.user || typeof reservation.user === 'string'
                          ? 'Community member'
                          : reservation.user.name;
                      const contactEmail =
                        !reservation.user || typeof reservation.user === 'string'
                          ? ''
                          : reservation.user.email;
                      const managedPlaceName =
                        !reservation.place || typeof reservation.place === 'string'
                          ? 'Managed place'
                          : reservation.place.name;
                      const reservationClosed = ['declined', 'cancelled', 'completed'].includes(
                        reservation.status
                      );

                      return (
                        <tr key={reservation._id}>
                          <td className="px-6 py-4 align-top">
                            <div className="font-semibold text-slate-900">
                              {managedPlaceName}
                            </div>
                            <div className="mt-2">
                              <ReservationStatusBadge status={reservation.status} />
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            <div>{bookedBy}</div>
                            {contactEmail && (
                              <div className="mt-1 text-slate-500">{contactEmail}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            <div>{formatReservationDateTime(reservation.reservationFor)}</div>
                            <div className="mt-1 text-slate-500">
                              Guests: {reservation.guests}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            {reservation.accessibilitySupportNotes ? (
                              <div>
                                <div className="font-medium text-slate-900">
                                  Accessibility needs
                                </div>
                                <div className="mt-1">
                                  {reservation.accessibilitySupportNotes}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500">No special notes</span>
                            )}
                            {reservation.ride.required && (
                              <div className="mt-3">
                                <ReservationStatusBadge
                                  status={reservation.ride.status}
                                  label={`Ride ${reservation.ride.status}`}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            <div className="mb-2">
                              <ReservationStatusBadge
                                status={reservation.ownerResponse.status}
                              />
                            </div>
                            <div>
                              {reservation.ownerResponse.message || 'No place reply sent yet.'}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            {!reservationClosed ? (
                              <div className="space-y-3">
                                <textarea
                                  rows={3}
                                  value={ownerResponseDrafts[reservation._id] || ''}
                                  onChange={(event) =>
                                    setOwnerResponseDrafts((current) => ({
                                      ...current,
                                      [reservation._id]: event.target.value,
                                    }))
                                  }
                                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                                  placeholder="Message to the guest"
                                />
                                <div className="flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleReservationResponse(
                                        reservation._id,
                                        'confirmed'
                                      )
                                    }
                                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleReservationResponse(
                                        reservation._id,
                                        'declined'
                                      )
                                    }
                                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">
                                No further action needed.
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm text-slate-500"
                      >
                        {isManaging
                          ? 'Loading reservation confirmations...'
                          : 'No reservation confirmations are waiting right now.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationControls
              currentPage={paginatedReservations.currentPage}
              totalPages={paginatedReservations.totalPages}
              onPageChange={setReservationsPage}
            />
          </section>
        )}

        {activeTab === 'transport' && (
          <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <CarFront className="text-emerald-700" size={20} />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Transport desk</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Confirm, decline, or complete ride requests tied to reservations.
                  </p>
                </div>
              </div>
            </div>

            {transportError && (
              <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
                {transportError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-[1180px] divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Place
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Pickup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Access requirements
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current Reply
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedTransport.items.length > 0 ? (
                    paginatedTransport.items.map((reservation) => {
                      const guestName =
                        !reservation.user || typeof reservation.user === 'string'
                          ? 'Community member'
                          : reservation.user.name;
                      const placeName =
                        !reservation.place || typeof reservation.place === 'string'
                          ? 'Reserved place'
                          : reservation.place.name;
                      const defaultProviderName =
                        reservation.ride.providerName ||
                        (reservation.ride.provider === 'uber'
                          ? 'Uber dispatch'
                          : 'Cab dispatch');

                      return (
                        <tr key={reservation._id}>
                          <td className="px-6 py-4 align-top">
                            <div className="font-semibold text-slate-900">{placeName}</div>
                            <div className="mt-2">
                              <ReservationStatusBadge
                                status={reservation.status}
                                label={`Visit ${reservation.status}`}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            {guestName}
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            <div>
                              {formatReservationDateTime(
                                reservation.ride.pickupTime || reservation.reservationFor
                              )}
                            </div>
                            <div className="mt-1 text-slate-500">
                              {reservation.ride.pickupAddress}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            <div>
                              {reservation.ride.provider === 'uber' ? 'Uber' : 'Cab'}
                            </div>
                            <div className="mt-1 text-slate-500">{defaultProviderName}</div>
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            {reservation.ride.accessibilityRequirements.length > 0 ? (
                              <div className="flex max-w-xs flex-wrap gap-2">
                                {reservation.ride.accessibilityRequirements.map((requirement) => (
                                  <span
                                    key={requirement}
                                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                                  >
                                    {requirement}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500">No specific requirements selected.</span>
                            )}
                            {reservation.ride.vehicleAccessibility.length > 0 && (
                              <div className="mt-3 text-slate-600">
                                Vehicle offers: {reservation.ride.vehicleAccessibility.join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 align-top text-sm text-slate-700">
                            <div className="mb-2">
                              <ReservationStatusBadge status={reservation.ride.status} />
                            </div>
                            <div>
                              {reservation.ride.statusMessage || 'No ride reply sent yet.'}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="space-y-3">
                              <input
                                value={providerNames[reservation._id] || defaultProviderName}
                                onChange={(event) =>
                                  setProviderNames((current) => ({
                                    ...current,
                                    [reservation._id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                                placeholder="Provider or dispatcher name"
                              />
                              <input
                                value={driverNames[reservation._id] || reservation.ride.driverName || ''}
                                onChange={(event) =>
                                  setDriverNames((current) => ({
                                    ...current,
                                    [reservation._id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                                placeholder="Driver name"
                              />
                              <input
                                value={driverPhones[reservation._id] || reservation.ride.driverPhone || ''}
                                onChange={(event) =>
                                  setDriverPhones((current) => ({
                                    ...current,
                                    [reservation._id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                                placeholder="Driver contact number"
                              />
                              <input
                                value={vehicleDetails[reservation._id] || reservation.ride.vehicleDetails || ''}
                                onChange={(event) =>
                                  setVehicleDetails((current) => ({
                                    ...current,
                                    [reservation._id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                                placeholder="Vehicle details, such as plate and vehicle type"
                              />
                              <input
                                value={vehicleAccessibility[reservation._id] || reservation.ride.vehicleAccessibility.join(', ')}
                                onChange={(event) =>
                                  setVehicleAccessibility((current) => ({
                                    ...current,
                                    [reservation._id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                                placeholder="Vehicle accessibility features, separated by commas"
                              />
                              <textarea
                                rows={3}
                                value={rideResponseDrafts[reservation._id] || ''}
                                onChange={(event) =>
                                  setRideResponseDrafts((current) => ({
                                    ...current,
                                    [reservation._id]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                                placeholder="Message to the guest about pickup confirmation"
                              />
                              <div className="flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRideResponse(
                                      reservation._id,
                                      'confirmed',
                                      defaultProviderName
                                    )
                                  }
                                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRideResponse(
                                      reservation._id,
                                      'declined',
                                      defaultProviderName
                                    )
                                  }
                                  className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
                                >
                                  Decline
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRideResponse(
                                      reservation._id,
                                      'completed',
                                      defaultProviderName
                                    )
                                  }
                                  className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700"
                                >
                                  Complete
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-slate-500"
                      >
                        {isTransportLoading
                          ? 'Loading ride requests...'
                          : 'No transport requests are waiting right now.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationControls
              currentPage={paginatedTransport.currentPage}
              totalPages={paginatedTransport.totalPages}
              onPageChange={setTransportPage}
            />
          </section>
        )}

        {(showForm || editingPlace) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
            <div className="w-full max-w-4xl">
              <PlaceForm
                place={editingPlace}
                allowVerification
                onSubmit={handleSubmit}
                onCancel={closeForm}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
