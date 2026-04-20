import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText, Loader2, LogOut, MapPinned, Package, RefreshCw, Save, Trash2, Wrench } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/apiClient';
import { getFeatureCenterCoordinates } from '../../lib/provinceMapGeometry';
import { buildProvinceMapBaseProfile } from '../../lib/provinceMapBaseProfile';
import { mergeProvinceMapProfile, sanitizeProvinceMapProfile } from '../../lib/provinceMapProfiles';
import { appRoutes } from '../../lib/routes';
import { CategoryType, ProvinceMapProduct, ProvinceMapProfile, ProvinceMapSuggestionSource } from '../../types';
import provinceGeojsonUrl from '../../interactive-map/public/data/vietnam-34-provinces.geojson?url';
import { getProvinceRegionMeta, getProvinceRegionCode } from '../../interactive-map/data/map-regions.js';
import { getProvinceAgricultureProfile } from '../../interactive-map/data/province-agriculture.js';

type ProvinceOption = {
  provinceId: string;
  provinceName: string;
  provinceType: string;
  regionLabel: string;
  regionCode: string;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
};

type FormState = {
  gpsLatitude: string;
  gpsLongitude: string;
  cultivatedAreaHectares: string;
  averageOutputMtPerYear: string;
  sowingPeriod: string;
  harvestPeriod: string;
  cropsPerYear: string;
  characteristics: string;
  varieties: string;
  products: ProvinceMapProduct[];
};

type StatusState = { type: 'success' | 'error' | null; message: string };
type MapAiScope = 'auto' | CategoryType;

const COPY = {
  title: 'Map Content Editor',
  description: 'Manage province agronomy data for the interactive map.',
  province: 'Province',
  type: 'Type',
  region: 'Region',
  gpsLatitude: 'GPS Latitude',
  gpsLongitude: 'GPS Longitude',
  cultivatedArea: 'Cultivated area (hectares)',
  averageOutput: 'Average output (MT/year)',
  sowingPeriod: 'Sowing period',
  harvestPeriod: 'Harvest period',
  cropsPerYear: 'Crops per year',
  characteristics: 'Characteristics',
  varieties: 'Varieties',
  reload: 'Reload',
  reset: 'Reset',
  resetting: 'Resetting...',
  save: 'Save changes',
  saving: 'Saving...',
  loading: 'Loading province editor...',
  saveSuccess: 'Province agronomy content saved to Turso.',
  resetSuccess: 'Province content reset to default.',
  loadError: 'Unable to load province data.',
  saveError: 'Unable to save province content.',
  resetError: 'Unable to reset province content.',
  preview: 'Preview',
  lastUpdated: 'Last updated',
  defaultContent: 'Default content',
  emptyValue: 'Not set',
  aiTitle: 'AI Suggest',
  aiScope: 'AI Scope',
  aiSuggest: 'Generate draft',
  aiSuggesting: 'Generating...',
  aiSuggestSuccess: 'AI draft loaded into the form. Review it before saving.',
  aiSuggestError: 'Unable to generate an AI draft.',
  aiSources: 'AI Sources',
  aiNoSources: 'No external sources were returned by the current provider.'
} as const;

const EMPTY_STATUS: StatusState = { type: null, message: '' };
const AI_SCOPE_OPTIONS: MapAiScope[] = ['auto', 'Rice', 'Coffee', 'Cashew', 'Pepper', 'Agriculture'];

const toFieldValue = (value: number | null | undefined) => (value !== null && value !== undefined && Number.isFinite(Number(value)) ? String(value) : '');
const toNullableNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildProvinceOptions = (payload: any): ProvinceOption[] =>
  (Array.isArray(payload?.features) ? payload.features : [])
    .map((feature) => {
      const provinceId = String(feature?.properties?.id ?? '').trim();
      const provinceName = String(feature?.properties?.name ?? '').trim();
      const provinceType = String(feature?.properties?.type ?? '').trim() || 'Province';
      const regionLabel = getProvinceRegionMeta(provinceId).label;
      const regionCode = getProvinceRegionCode(provinceId);
      const center = getFeatureCenterCoordinates(feature);
      return {
        provinceId,
        provinceName,
        provinceType,
        regionLabel,
        regionCode,
        gpsLatitude: center?.latitude ?? null,
        gpsLongitude: center?.longitude ?? null
      };
    })
    .filter((item) => item.provinceId && item.provinceName)
    .sort((a, b) => a.provinceName.localeCompare(b.provinceName, 'vi'));

const toFormState = (profile: ProvinceMapProfile): FormState => ({
  gpsLatitude: toFieldValue(profile.gpsLatitude),
  gpsLongitude: toFieldValue(profile.gpsLongitude),
  cultivatedAreaHectares: toFieldValue(profile.cultivatedAreaHectares),
  averageOutputMtPerYear: toFieldValue(profile.averageOutputMtPerYear),
  sowingPeriod: profile.sowingPeriod ?? '',
  harvestPeriod: profile.harvestPeriod ?? '',
  cropsPerYear: toFieldValue(profile.cropsPerYear),
  characteristics: profile.characteristics ?? '',
  varieties: profile.varieties ?? '',
  products: Array.isArray(profile.products) ? profile.products : []
});

const inputClassName =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-foodmax-forest';
const labelClassName = 'mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-gray-500';

export default function AdminInteractiveMapContent() {
  const { logout } = useAuth();
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [savedProfilesById, setSavedProfilesById] = useState<Record<string, ProvinceMapProfile>>({});
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [formState, setFormState] = useState<FormState | null>(null);
  const [status, setStatus] = useState<StatusState>(EMPTY_STATUS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [aiScope, setAiScope] = useState<MapAiScope>('auto');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionSources, setSuggestionSources] = useState<ProvinceMapSuggestionSource[]>([]);

  const loadEditorData = async () => {
    setIsLoading(true);
    setStatus(EMPTY_STATUS);
    try {
      const [geojsonResponse, profilePayload] = await Promise.all([fetch(provinceGeojsonUrl, { cache: 'force-cache' }), api.getProvinceMapProfiles()]);
      if (!geojsonResponse.ok) throw new Error(COPY.loadError);
      const nextProvinceOptions = buildProvinceOptions(await geojsonResponse.json());
      const nextProfilesById = Object.fromEntries((profilePayload.profiles ?? []).map((profile) => [profile.provinceId, profile]));
      setProvinceOptions(nextProvinceOptions);
      setSavedProfilesById(nextProfilesById);
      setSelectedProvinceId((current) => (current && nextProvinceOptions.some((item) => item.provinceId === current) ? current : nextProvinceOptions[0]?.provinceId ?? ''));
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : COPY.loadError });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEditorData();
  }, []);

  const selectedProvince = useMemo(() => provinceOptions.find((item) => item.provinceId === selectedProvinceId) ?? null, [provinceOptions, selectedProvinceId]);
  const baseProfile = useMemo(() => {
    if (!selectedProvince) return null;
    const agricultureProfile = getProvinceAgricultureProfile({
      provinceId: selectedProvince.provinceId,
      provinceName: selectedProvince.provinceName,
      provinceType: selectedProvince.provinceType,
      regionCode: selectedProvince.regionCode,
      regionLabel: selectedProvince.regionLabel
    });
    const staticProducts: ProvinceMapProduct[] = (agricultureProfile.products ?? []).map((item: any) => ({
      name: String(item.name ?? ''),
      location: String(item.location ?? ''),
      zoneCount: Number(item.zoneCount ?? 1),
      rating: typeof item.rating === 'number' ? item.rating : null
    }));
    return buildProvinceMapBaseProfile({
      provinceId: selectedProvince.provinceId,
      provinceName: selectedProvince.provinceName,
      provinceType: selectedProvince.provinceType,
      regionLabel: selectedProvince.regionLabel,
      color: getProvinceRegionMeta(selectedProvince.provinceId).color,
      gpsLatitude: selectedProvince.gpsLatitude,
      gpsLongitude: selectedProvince.gpsLongitude,
      staticProducts,
      staticCharacteristics: String(agricultureProfile.overview ?? '')
    });
  }, [selectedProvince]);
  const savedProfile = useMemo(() => (baseProfile ? mergeProvinceMapProfile(baseProfile, savedProfilesById[selectedProvinceId]) : null), [baseProfile, savedProfilesById, selectedProvinceId]);
  const defaultFormState = useMemo(() => (savedProfile ? toFormState(savedProfile) : null), [savedProfile]);

  useEffect(() => {
    setFormState(defaultFormState);
  }, [defaultFormState, selectedProvinceId]);

  const previewProfile = useMemo(() => {
    if (!baseProfile || !selectedProvinceId || !formState) return savedProfile;
    return mergeProvinceMapProfile(baseProfile, sanitizeProvinceMapProfile(selectedProvinceId, { gpsLatitude: toNullableNumber(formState.gpsLatitude), gpsLongitude: toNullableNumber(formState.gpsLongitude), cultivatedAreaHectares: toNullableNumber(formState.cultivatedAreaHectares), averageOutputMtPerYear: toNullableNumber(formState.averageOutputMtPerYear), sowingPeriod: formState.sowingPeriod, harvestPeriod: formState.harvestPeriod, cropsPerYear: toNullableNumber(formState.cropsPerYear), characteristics: formState.characteristics, varieties: formState.varieties, products: formState.products }));
  }, [baseProfile, formState, savedProfile, selectedProvinceId]);

  const isDirty = useMemo(() => JSON.stringify(formState) !== JSON.stringify(defaultFormState), [defaultFormState, formState]);

  const applyField = (field: keyof Omit<FormState, 'products'>, value: string) => setFormState((current) => (current ? { ...current, [field]: value } : current));

  const handleSave = async () => {
    if (!selectedProvinceId || !formState) return;
    setIsSaving(true);
    setStatus(EMPTY_STATUS);
    try {
      const result = await api.upsertProvinceMapProfile(sanitizeProvinceMapProfile(selectedProvinceId, { gpsLatitude: toNullableNumber(formState.gpsLatitude), gpsLongitude: toNullableNumber(formState.gpsLongitude), cultivatedAreaHectares: toNullableNumber(formState.cultivatedAreaHectares), averageOutputMtPerYear: toNullableNumber(formState.averageOutputMtPerYear), sowingPeriod: formState.sowingPeriod, harvestPeriod: formState.harvestPeriod, cropsPerYear: toNullableNumber(formState.cropsPerYear), characteristics: formState.characteristics, varieties: formState.varieties, products: formState.products }));
      setSavedProfilesById((current) => ({ ...current, [result.profile.provinceId]: result.profile }));
      setStatus({ type: 'success', message: COPY.saveSuccess });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ApiError || error instanceof Error ? error.message : COPY.saveError });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuggest = async () => {
    if (!selectedProvince || !baseProfile) return;
    setIsSuggesting(true);
    setStatus(EMPTY_STATUS);
    try {
      const result = await api.suggestProvinceMapProfile({ provinceId: selectedProvince.provinceId, provinceName: selectedProvince.provinceName, provinceType: selectedProvince.provinceType, regionLabel: selectedProvince.regionLabel, categoryScope: aiScope });
      setFormState(toFormState(mergeProvinceMapProfile(baseProfile, result.profile)));
      setSuggestionSources(result.sources ?? []);
      setStatus({ type: 'success', message: COPY.aiSuggestSuccess });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ApiError || error instanceof Error ? error.message : COPY.aiSuggestError });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleReset = async () => {
    if (!selectedProvinceId) return;
    setIsResetting(true);
    setStatus(EMPTY_STATUS);
    try {
      await api.deleteProvinceMapProfile(selectedProvinceId);
      setSavedProfilesById((current) => {
        const next = { ...current };
        delete next[selectedProvinceId];
        return next;
      });
      setStatus({ type: 'success', message: COPY.resetSuccess });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof ApiError || error instanceof Error ? error.message : COPY.resetError });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || !selectedProvince || !formState || !previewProfile) {
    return <div className="flex min-h-screen bg-stone-100 font-sans"><div className="flex-grow px-6 py-10"><div className="mx-auto max-w-6xl rounded-[2rem] border border-gray-200 bg-white px-6 py-5 text-sm font-semibold text-gray-600 shadow-sm">{isLoading ? <span className="inline-flex items-center gap-3"><Loader2 size={18} className="animate-spin text-foodmax-forest" />{COPY.loading}</span> : COPY.loadError}</div></div></div>;
  }

  const previewRows = [
    [`${COPY.gpsLatitude} / ${COPY.gpsLongitude}`, previewProfile.gpsLatitude !== null && previewProfile.gpsLongitude !== null ? `${previewProfile.gpsLatitude}, ${previewProfile.gpsLongitude}` : COPY.emptyValue],
    [COPY.cultivatedArea, previewProfile.cultivatedAreaHectares !== null ? String(previewProfile.cultivatedAreaHectares) : COPY.emptyValue],
    [COPY.averageOutput, previewProfile.averageOutputMtPerYear !== null ? String(previewProfile.averageOutputMtPerYear) : COPY.emptyValue],
    [COPY.sowingPeriod, previewProfile.sowingPeriod || COPY.emptyValue],
    [COPY.harvestPeriod, previewProfile.harvestPeriod || COPY.emptyValue],
    [COPY.cropsPerYear, previewProfile.cropsPerYear !== null ? String(previewProfile.cropsPerYear) : COPY.emptyValue],
    [COPY.characteristics, previewProfile.characteristics || COPY.emptyValue],
    [COPY.varieties, previewProfile.varieties || COPY.emptyValue]
  ];

  return (
    <div className="flex min-h-screen bg-stone-100 font-sans">
      {/* Mini Sidebar — matching Inventory / News pattern */}
      <aside className="w-[5.5rem] bg-foodmax-forest text-white flex flex-col items-center py-8 gap-8 sticky top-0 h-screen shadow-2xl z-20">
        <Link to={appRoutes.admin} className="p-3.5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex flex-col gap-6 flex-grow">
          <Link to={appRoutes.adminInventory} className="p-3.5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5" title="Inventory">
            <Package size={24} />
          </Link>
          <Link to={appRoutes.adminNews} className="p-3.5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/5" title="News">
            <FileText size={24} />
          </Link>
          <Link to={appRoutes.adminMapContent} className="p-3.5 bg-foodmax-lime text-foodmax-forest rounded-2xl shadow-xl shadow-foodmax-lime/20 border border-foodmax-lime/20" title="Map Content">
            <MapPinned size={24} />
          </Link>
        </div>

        {/* Mini Branded Exit Button */}
        <div className="mt-auto pt-6 border-t border-white/10 w-full flex flex-col items-center gap-4">
          <Link
            to={appRoutes.home}
            onClick={() => logout()}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all group relative overflow-visible"
            title="Exit to Homepage"
          >
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
              <div className="flex items-center relative">
                <span className="text-foodmax-forest font-[900] text-xl">F</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-foodmax-lime rounded-full flex items-center justify-center border-2 border-foodmax-forest shadow-md">
              <LogOut size={10} className="text-foodmax-forest" />
            </div>
          </Link>
        </div>
      </aside>

      <main className="flex-grow px-6 py-10 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900">{COPY.title}</h1>
                <p className="mt-3 text-sm font-medium text-gray-500">{COPY.description}</p>
                <p className="mt-2 text-sm font-semibold text-gray-500">{selectedProvince.provinceName} · {selectedProvince.regionLabel}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={appRoutes.commercialTool} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700">Public map</Link>
                <button type="button" onClick={() => void loadEditorData()} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700"><RefreshCw size={16} />{COPY.reload}</button>
                <button type="button" onClick={handleReset} disabled={isResetting} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-60">{isResetting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{isResetting ? COPY.resetting : COPY.reset}</button>
                <button type="button" onClick={handleSave} disabled={isSaving || !isDirty} className="inline-flex items-center gap-2 rounded-2xl bg-foodmax-forest px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{isSaving ? COPY.saving : COPY.save}</button>
              </div>
            </div>
            {status.type ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${status.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{status.message}</div> : null}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2"><label className={labelClassName}>{COPY.province}</label><select value={selectedProvinceId} onChange={(event) => setSelectedProvinceId(event.target.value)} className={inputClassName}>{provinceOptions.map((province) => <option key={province.provinceId} value={province.provinceId}>{province.provinceName}</option>)}</select></div>
                <div><label className={labelClassName}>{COPY.type}</label><div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">{selectedProvince.provinceType}</div></div>
              </div>
              <div className="mt-6 rounded-[1.75rem] border border-gray-200 bg-gray-50 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-sm font-black uppercase tracking-[0.16em] text-gray-700">{COPY.aiTitle}</h3></div><button type="button" onClick={handleSuggest} disabled={isSuggesting} className="inline-flex items-center gap-2 rounded-2xl bg-foodmax-lime px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-foodmax-forest shadow-xl disabled:opacity-60">{isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}{isSuggesting ? COPY.aiSuggesting : COPY.aiSuggest}</button></div><div className="mt-4 max-w-sm"><label className={labelClassName}>{COPY.aiScope}</label><select value={aiScope} onChange={(event) => setAiScope(event.target.value as MapAiScope)} className={inputClassName}>{AI_SCOPE_OPTIONS.map((scope) => <option key={scope} value={scope}>{scope}</option>)}</select></div></div>
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2"><div><label className={labelClassName}>{COPY.gpsLatitude}</label><input value={formState.gpsLatitude} onChange={(event) => applyField('gpsLatitude', event.target.value.replace(/[^0-9.-]/g, ''))} className={inputClassName} /></div><div><label className={labelClassName}>{COPY.gpsLongitude}</label><input value={formState.gpsLongitude} onChange={(event) => applyField('gpsLongitude', event.target.value.replace(/[^0-9.-]/g, ''))} className={inputClassName} /></div></div>
                <div className="grid gap-4 md:grid-cols-2"><div><label className={labelClassName}>{COPY.cultivatedArea}</label><input value={formState.cultivatedAreaHectares} onChange={(event) => applyField('cultivatedAreaHectares', event.target.value.replace(/[^0-9.]/g, ''))} className={inputClassName} /></div><div><label className={labelClassName}>{COPY.averageOutput}</label><input value={formState.averageOutputMtPerYear} onChange={(event) => applyField('averageOutputMtPerYear', event.target.value.replace(/[^0-9.]/g, ''))} className={inputClassName} /></div></div>
                <div className="grid gap-4 md:grid-cols-3"><div><label className={labelClassName}>{COPY.sowingPeriod}</label><input value={formState.sowingPeriod} onChange={(event) => applyField('sowingPeriod', event.target.value)} className={inputClassName} /></div><div><label className={labelClassName}>{COPY.harvestPeriod}</label><input value={formState.harvestPeriod} onChange={(event) => applyField('harvestPeriod', event.target.value)} className={inputClassName} /></div><div><label className={labelClassName}>{COPY.cropsPerYear}</label><input value={formState.cropsPerYear} onChange={(event) => applyField('cropsPerYear', event.target.value.replace(/[^0-9.]/g, ''))} className={inputClassName} /></div></div>
                <div><label className={labelClassName}>{COPY.characteristics}</label><textarea value={formState.characteristics} onChange={(event) => applyField('characteristics', event.target.value)} rows={5} className={inputClassName} /></div>
                <div><label className={labelClassName}>{COPY.varieties}</label><textarea value={formState.varieties} onChange={(event) => applyField('varieties', event.target.value)} rows={4} className={inputClassName} /></div>
              </div>
            </section>
            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"><h3 className="text-2xl font-black text-gray-900">{COPY.preview}</h3><p className="mt-2 text-sm font-semibold text-gray-500">{selectedProvince.provinceName} · {selectedProvince.regionLabel}</p><div className="mt-6 space-y-3">{previewRows.map(([label, value]) => <div key={label} className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-4 py-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">{label}</p><p className="mt-2 text-sm font-black leading-6 text-gray-900">{value}</p></div>)}</div></section>
              <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"><h4 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500">{COPY.lastUpdated}</h4><p className="mt-3 text-sm font-semibold text-gray-700">{savedProfilesById[selectedProvinceId]?.updatedAt || COPY.defaultContent}</p></section>
              <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm"><h4 className="text-sm font-black uppercase tracking-[0.16em] text-gray-500">{COPY.aiSources}</h4>{suggestionSources.length > 0 ? <div className="mt-4 space-y-3">{suggestionSources.map((source) => <a key={source.uri} href={source.uri} target="_blank" rel="noreferrer" className="block rounded-[1.25rem] border border-gray-100 bg-gray-50 px-4 py-3"><p className="text-sm font-black text-gray-900">{source.title}</p><p className="mt-1 break-all text-xs font-semibold text-gray-500">{source.uri}</p></a>)}</div> : <p className="mt-4 text-sm font-semibold text-gray-500">{COPY.aiNoSources}</p>}</section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
