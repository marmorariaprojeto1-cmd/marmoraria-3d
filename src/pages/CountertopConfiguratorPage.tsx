import { type FormEvent, type PointerEvent, useMemo, useRef, useState, useEffect } from 'react';
import { calculateQuoteEstimate, resolveThicknessMultiplier, roundMoney } from '../catalog/pricing';
import type { QuoteEngineResult } from '../catalog/pricing';
import { ThreeDPreview } from '../components/three/ThreeDPreview';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import {
  fallbackCompany,
  fetchPublicCompany,
  resolvePublicCompanyIdentifier,
  type PublicCompany,
} from '../publicSite/siteData';

type StoneOption = {
  id: string;
  name: string;
  pricePerM2: number;
  texturePath: string | null;
};

type ProjectImageSnapshot = {
  type: 'image/png';
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
};

const DEFAULT_SKIRT_HEIGHT_CM = 10;

const CUTOUT_SIZES: Record<string, { width: number; depth: number; componentId: string }> = {
  'sink-45cm':   { width: 0.50, depth: 0.40, componentId: 'COMPONENT_050' },
  'sink-60cm':   { width: 0.56, depth: 0.34, componentId: 'COMPONENT_051' },
  'cooktop-4':   { width: 0.50, depth: 0.50, componentId: 'COMPONENT_052' },
  'cooktop-5':   { width: 0.75, depth: 0.52, componentId: 'COMPONENT_053' },
};

type PricingComponentItem = {
  id: string;
  label: string;
  formula: string;
  areaM2: number | null;
  configuredPrice: number;
  price: number;
  source: 'stone_area' | 'cutouts';
};

type TechnicalServicePrice = {
  id: string;
  name: string;
  price: number;
};

const PRESET_STONE_NAMES: Partial<Record<PresetId, string>> = {
  kitchen: 'Granito Branco Fortaleza',
  gourmet: 'Granito Branco Dallas',
  bathroom: 'Granito Branco Siena',
  island: 'Granito Branco Siena',
  counter: 'Granito Branco Fortaleza',
  laundry: 'Granito Branco Fortaleza',
};

function normalizeStoneName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

type PresetId =
  | 'bathroom'
  | 'kitchen'
  | 'gourmet'
  | 'gourmetPremium'
  | 'laundry'
  | 'island'
  | 'islandGourmet'
  | 'counter';

// ── Helpers ────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function buildEmptyQuoteResult(): QuoteEngineResult {
  return { area: 0, stonePrice: 0, sinkPrice: 0, finishPrice: 0, thicknessMultiplier: 1, subtotal: 0, total: 0 };
}

function trimOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildStonePiecePrice({
  id,
  label,
  length,
  heightCm,
  pricePerM2,
  thicknessMultiplier,
}: {
  id: string;
  label: string;
  length: number;
  heightCm: number;
  pricePerM2: number;
  thicknessMultiplier: number;
}): PricingComponentItem {
  const heightM = heightCm / 100;
  const areaM2 = roundMoney(length * heightM);
  const price = roundMoney(areaM2 * pricePerM2 * thicknessMultiplier);

  return {
    id,
    label,
    formula: `${length.toFixed(2)}m x ${heightM.toFixed(2)}m x ${formatCurrency(pricePerM2)}/m² x ${thicknessMultiplier.toFixed(2)}`,
    areaM2,
    configuredPrice: price,
    price,
    source: 'stone_area',
  };
}

function buildFixedComponentPrice({
  service,
  fallbackId,
  label,
}: {
  service: TechnicalServicePrice | null;
  fallbackId: string;
  label: string;
}): PricingComponentItem {
  const price = service?.price ?? 0;

  return {
    id: service?.id ?? fallbackId,
    label,
    formula: service ? 'Preço configurado em Recortes' : 'Preço não configurado',
    areaM2: null,
    configuredPrice: price,
    price,
    source: 'cutouts',
  };
}

function normalizeServiceName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function findCutoutService(
  services: TechnicalServicePrice[],
  matcher: (normalizedName: string) => boolean,
) {
  return services.find((service) => matcher(normalizeServiceName(service.name))) ?? null;
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4);
}

// ── Subcomponentes ─────────────────────────────────────────────────

function ToggleButton({
  icon,
  label,
  active,
  onClick,
  valueLabel,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  valueLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-2 rounded-xl border p-2 text-left text-xs shadow-[0_8px_22px_rgba(31,41,51,0.06)] transition',
        active
          ? 'border-moss/55 bg-white/92 text-moss ring-1 ring-moss/20'
          : 'border-white/55 bg-white/72 text-stone-700 hover:border-moss/25 hover:bg-white/90',
      ].join(' ')}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="truncate font-semibold leading-tight">{label}</span>
      </span>
      {valueLabel && (
        <span className="flex-none font-semibold leading-tight text-graphite">
          {valueLabel}
        </span>
      )}
    </button>
  );
}

function HeightInput({ value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label className="block">
      <input
        type="range"
        min="0"
        max="126"
        step="1"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="component-height-slider w-full disabled:opacity-50"
      />
    </label>
  );
}

function PresetCard({
  label,
  imagePath,
  selected,
  onClick,
}: {
  label: string;
  imagePath: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group relative aspect-[1.55/1] overflow-hidden rounded-xl border bg-stone-200 text-left shadow-[0_10px_28px_rgba(31,41,51,0.06)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_16px_38px_rgba(31,41,51,0.14)]',
        selected
          ? 'border-moss/75 shadow-[0_0_0_1px_rgba(79,111,82,0.22),0_18px_42px_rgba(79,111,82,0.18)]'
          : 'border-white/65 hover:border-moss/25',
      ].join(' ')}
    >
      {imageError ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,111,82,0.18),transparent_34%),linear-gradient(135deg,rgba(245,245,244,0.96),rgba(168,162,158,0.52))]" />
      ) : (
        <img
          src={imagePath}
          alt={label}
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          onError={() => setImageError(true)}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/62 via-black/20 to-transparent" />
      <span className="absolute bottom-2.5 left-3 right-3 truncate text-xs font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
        {label}
      </span>
    </button>
  );
}

type RulerTarget = 'wetArea' | 'sink' | 'cooktop';

function formatRulerMeasure(value: number) {
  return `${value.toFixed(2)}m`;
}

function RulerMeasureLabel({
  totalWidth,
  start,
  end,
  className = '',
}: {
  totalWidth: number;
  start: number;
  end: number;
  className?: string;
}) {
  const width = Math.max(0, end - start);

  if (totalWidth <= 0 || width < 0.04) {
    return null;
  }

  const center = `${(((start + end) / 2) / totalWidth) * 100}%`;

  return (
    <span
      className={[
        'pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap text-center text-[10px] font-semibold leading-none text-stone-500/80',
        className,
      ].join(' ')}
      style={{
        left: center,
      }}
    >
      {formatRulerMeasure(width)}
    </span>
  );
}

function UnifiedPositionRuler({
  totalWidth,
  wetArea,
  sink,
  cooktop,
}: {
  totalWidth: number;
  wetArea: {
    enabled: boolean;
    valid: boolean;
    width: number;
    centerX: number;
    onChange: (x: number) => void;
  };
  sink: {
    enabled: boolean;
    width: number;
    centerX: number;
    minCenter: number;
    maxCenter: number;
    onChange: (x: number) => void;
  };
  cooktop: {
    enabled: boolean;
    width: number;
    centerX: number;
    minCenter: number;
    maxCenter: number;
    onChange: (x: number) => void;
  };
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<RulerTarget | null>(null);

  const meterToPercent = (value: number) => `${(value / totalWidth) * 100}%`;
  const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const updateTarget = (target: RulerTarget, clientX: number) => {
    const track = trackRef.current;
    if (!track || totalWidth <= 0) return;

    const rect = track.getBoundingClientRect();
    const ratio = clampValue((clientX - rect.left) / rect.width, 0, 1);
    const nextX = ratio * totalWidth;

    if (target === 'wetArea') {
      const halfWet = wetArea.width / 2;
      wetArea.onChange(clampValue(nextX, halfWet, totalWidth - halfWet));
      return;
    }

    if (target === 'sink') {
      sink.onChange(clampValue(nextX, sink.minCenter, sink.maxCenter));
      return;
    }

    cooktop.onChange(clampValue(nextX, cooktop.minCenter, cooktop.maxCenter));
  };

  const startDrag = (target: RulerTarget) => (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(target);
    updateTarget(target, event.clientX);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateTarget(dragging, event.clientX);
  };

  const stopDrag = () => setDragging(null);

  const wetLeft = wetArea.centerX - wetArea.width / 2;
  const wetRight = wetArea.centerX + wetArea.width / 2;
  const sinkLeft = sink.centerX - sink.width / 2;
  const sinkRight = sink.centerX + sink.width / 2;
  const cooktopLeft = cooktop.centerX - cooktop.width / 2;
  const cooktopRight = cooktop.centerX + cooktop.width / 2;
  const wetActive = wetArea.enabled && wetArea.valid;
  const sinkInsideWetArea = wetActive && sink.enabled && sinkLeft >= wetLeft && sinkRight <= wetRight;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
        <span>0.00m</span>
        <span>{totalWidth.toFixed(2)}m</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-16 rounded-2xl border border-white/60 bg-white/40 px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onPointerLeave={stopDrag}
      >
        <div className="absolute left-3 right-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-stone-300/65" />

        {wetActive && (
          <RulerMeasureLabel
            totalWidth={totalWidth}
            start={0}
            end={wetLeft}
            className="top-1"
          />
        )}

        {wetActive && cooktop.enabled && (
          <RulerMeasureLabel
            totalWidth={totalWidth}
            start={wetRight}
            end={cooktopLeft}
            className="top-1"
          />
        )}

        {cooktop.enabled && (
          <RulerMeasureLabel
            totalWidth={totalWidth}
            start={cooktopRight}
            end={totalWidth}
            className="top-1"
          />
        )}

        {wetActive && (
          <div
            className="absolute top-1/2 h-7 -translate-y-1/2 rounded-full border border-moss/25 bg-moss/15"
            style={{
              left: `calc(${meterToPercent(wetLeft)} + 12px)`,
              width: `calc(${meterToPercent(wetArea.width)} - 24px)`,
            }}
          />
        )}

        {sinkInsideWetArea && (
          <RulerMeasureLabel
            totalWidth={totalWidth}
            start={sinkLeft}
            end={sinkRight}
            className="bottom-1 text-sky-900/70"
          />
        )}

        {sink.enabled && (
          <div
            className="absolute top-1/2 h-5 -translate-y-1/2 rounded-full bg-sky-900/20"
            style={{
              left: `calc(${meterToPercent(sinkLeft)} + 12px)`,
              width: `calc(${meterToPercent(sink.width)} - 24px)`,
            }}
          />
        )}

        {cooktop.enabled && (
          <div
            className="absolute top-1/2 h-5 -translate-y-1/2 rounded-full bg-graphite/25"
            style={{
              left: `calc(${meterToPercent(cooktopLeft)} + 12px)`,
              width: `calc(${meterToPercent(cooktop.width)} - 24px)`,
            }}
          />
        )}

        {wetActive && (
          <button
            type="button"
            aria-label="Mover área molhada"
            onPointerDown={startDrag('wetArea')}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-moss shadow-[0_4px_12px_rgba(31,41,51,0.22)]"
            style={{ left: meterToPercent(wetArea.centerX) }}
          />
        )}

        {sink.enabled && (
          <button
            type="button"
            aria-label="Mover cuba"
            onPointerDown={startDrag('sink')}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-sky-900 shadow-[0_4px_12px_rgba(31,41,51,0.22)]"
            style={{ left: meterToPercent(sink.centerX) }}
          />
        )}

        {cooktop.enabled && (
          <button
            type="button"
            aria-label="Mover cooktop"
            onPointerDown={startDrag('cooktop')}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-graphite shadow-[0_4px_12px_rgba(31,41,51,0.22)]"
            style={{ left: meterToPercent(cooktop.centerX) }}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-stone-600">
        {wetActive && <span>Área molhada</span>}
        {sink.enabled && <span>Cuba</span>}
        {cooktop.enabled && <span>Cooktop</span>}
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────

export function CountertopConfiguratorPage() {
  const publicCompanyIdentifier = resolvePublicCompanyIdentifier();
  const previewRef = useRef<HTMLDivElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);
  const [width, setWidth] = useState('2.00');
  const [depth, setDepth] = useState('0.60');
  const [thickness] = useState(2);
  const [currentCompany, setCurrentCompany] = useState<PublicCompany | null>(null);
  const [stones, setStones] = useState<StoneOption[]>([]);
  const [stoneId, setStoneId] = useState('');
  const [stonesLoading, setStonesLoading] = useState(true);
  const [stonesError, setStonesError] = useState('');

  // Wet area
  const [wetWidth, setWetWidth] = useState('0.50');
  const [wetCenterX, setWetCenterX] = useState(1.0);

  // Components toggles
  const [backBacksplash, setBackBacksplash] = useState(false);
  const [leftBacksplash, setLeftBacksplash] = useState(false);
  const [rightBacksplash, setRightBacksplash] = useState(false);
  const [frontApron, setFrontApron] = useState(false);
  const [rearApron, setRearApron] = useState(false);
  const [leftFrontApron, setLeftFrontApron] = useState(false);
  const [rightFrontApron, setRightFrontApron] = useState(false);
  const [sinkEnabled] = useState(false); // legado: substituído por cutoutType
  const [wetAreaEnabled, setWetAreaEnabled] = useState(false);

  // Cutout — estados independentes para Cuba e Cooktop
  const [sinkCutout, setSinkCutout] = useState<{ enabled: boolean; type: 'sink-45cm' | 'sink-60cm'; centerX: number }>({ enabled: false, type: 'sink-45cm', centerX: 0.60 });
  const [cooktopCutout, setCooktopCutout] = useState<{ enabled: boolean; type: 'cooktop-4' | 'cooktop-5'; centerX: number }>({ enabled: false, type: 'cooktop-4', centerX: 1.40 });

  const sinkActive = sinkCutout.enabled;
  const cooktopActive = cooktopCutout.enabled;
  const anyCutoutActive = sinkActive || cooktopActive;

  // Skirt heights
  const [frontApronH, setFrontApronH] = useState(DEFAULT_SKIRT_HEIGHT_CM);
  const [rearApronH, setRearApronH] = useState(DEFAULT_SKIRT_HEIGHT_CM);
  const [leftApronH, setLeftApronH] = useState(DEFAULT_SKIRT_HEIGHT_CM);
  const [rightApronH, setRightApronH] = useState(DEFAULT_SKIRT_HEIGHT_CM);

  // Backsplash heights
  const [backBsH, setBackBsH] = useState(DEFAULT_SKIRT_HEIGHT_CM);
  const [leftBsH, setLeftBsH] = useState(DEFAULT_SKIRT_HEIGHT_CM);
  const [rightBsH, setRightBsH] = useState(DEFAULT_SKIRT_HEIGHT_CM);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [cutoutServices, setCutoutServices] = useState<TechnicalServicePrice[]>([]);

  const selectedStone = stones.find((s) => s.id === stoneId) ?? stones[0] ?? null;

  const numWidth = Number(width) || 0;
  const numDepth = Number(depth) || 0;
  const numWetWidth = Number(wetWidth) || 0;

  // Área molhada — centro + bounds
  const wetLeftEdge = wetCenterX - numWetWidth / 2;
  const wetRightEdge = wetCenterX + numWetWidth / 2;
  const wetAreaValid = numWetWidth > 0 && wetLeftEdge >= 0 && wetRightEdge <= numWidth;
  const sinkCutoutService = useMemo(
    () => findCutoutService(
      cutoutServices,
      (name) => name.includes('cuba'),
    ),
    [cutoutServices],
  );
  const cooktopCutoutService = useMemo(
    () => findCutoutService(
      cutoutServices,
      (name) => name.includes('cooktop'),
    ),
    [cutoutServices],
  );
  const wetAreaCutoutService = useMemo(
    () => findCutoutService(
      cutoutServices,
      (name) => name.includes('area') && name.includes('molhada'),
    ),
    [cutoutServices],
  );

  // Cuba: quando área molhada está ativa, Cuba fica confinada dentro dela
  const sinkBoundsWidth = wetAreaEnabled && wetAreaValid ? numWetWidth : numWidth;
  const sinkBoundsOffset = wetAreaEnabled && wetAreaValid ? wetLeftEdge : 0;
  const globalSinkCenterX = sinkBoundsOffset + sinkCutout.centerX;

  // Clampa Cuba para dentro da área molhada quando ela é ativada/redimensionada
  useEffect(() => {
    if (!sinkActive || !wetAreaEnabled || !wetAreaValid) return;
    const halfSink = CUTOUT_SIZES[sinkCutout.type].width / 2;
    const minLocal = halfSink;
    const maxLocal = numWetWidth - halfSink;
    if (sinkCutout.centerX < minLocal || sinkCutout.centerX > maxLocal) {
      setSinkCutout(s => ({ ...s, centerX: Math.min(maxLocal, Math.max(minLocal, s.centerX)) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wetAreaEnabled, wetAreaValid, numWetWidth]);

  function handleToggleWetArea() {
    if (wetAreaEnabled) {
      setWetAreaEnabled(false);
      return;
    }

    setWetWidth('1.00');
    setWetCenterX(0.60);
    setWetAreaEnabled(true);
  }

  function applyPreset(preset: PresetId) {
    const presets = {
      bathroom: {
        width: '1.20',
        depth: '0.55',
        sink: true,
        sinkType: 'sink-45cm' as const,
        sinkCenterX: 0.60,
        wetArea: false,
        wetWidth: '0.80',
        wetCenterX: 0.40,
        cooktop: false,
        cooktopType: 'cooktop-4' as const,
        cooktopCenterX: 0.75,
        backBacksplash: true,
        leftBacksplash: false,
        rightBacksplash: true,
        frontApron: true,
        rearApron: false,
        leftFrontApron: true,
        rightFrontApron: true,
        backsplashHeight: 10,
        apronHeight: 10,
      },
      kitchen: {
        width: '1.50',
        depth: '0.60',
        sink: true,
        sinkType: 'sink-45cm' as const,
        sinkCenterX: 0.40,
        wetArea: true,
        wetWidth: '0.80',
        wetCenterX: 0.40,
        cooktop: false,
        cooktopType: 'cooktop-4' as const,
        cooktopCenterX: 1.05,
        backBacksplash: true,
        leftBacksplash: false,
        rightBacksplash: false,
        frontApron: true,
        rearApron: false,
        leftFrontApron: false,
        rightFrontApron: false,
        backsplashHeight: 10,
        apronHeight: 10,
      },
      gourmet: {
        width: '3.00',
        depth: '0.60',
        sink: true,
        sinkType: 'sink-60cm' as const,
        sinkCenterX: 0.50,
        wetArea: true,
        wetWidth: '1.00',
        wetCenterX: 0.50,
        cooktop: true,
        cooktopType: 'cooktop-5' as const,
        cooktopCenterX: 2.35,
        backBacksplash: true,
        leftBacksplash: false,
        rightBacksplash: false,
        frontApron: true,
        rearApron: true,
        leftFrontApron: true,
        rightFrontApron: false,
        backsplashHeight: 10,
        apronHeight: 10,
      },
      gourmetPremium: {
        width: '3.00',
        depth: '0.65',
        sink: true,
        sinkType: 'sink-60cm' as const,
        sinkCenterX: 0.60,
        wetArea: true,
        wetWidth: '1.20',
        wetCenterX: 0.60,
        cooktop: true,
        cooktopType: 'cooktop-5' as const,
        cooktopCenterX: 2.35,
        backBacksplash: true,
        leftBacksplash: false,
        rightBacksplash: false,
        frontApron: true,
        rearApron: false,
        leftFrontApron: false,
        rightFrontApron: false,
        backsplashHeight: 10,
        apronHeight: 10,
      },
      laundry: {
        width: '1.69',
        depth: '0.60',
        sink: true,
        sinkType: 'sink-45cm' as const,
        sinkCenterX: 0.46,
        wetArea: true,
        wetWidth: '0.92',
        wetCenterX: 0.46,
        cooktop: false,
        cooktopType: 'cooktop-4' as const,
        cooktopCenterX: 1.05,
        backBacksplash: true,
        leftBacksplash: false,
        rightBacksplash: false,
        frontApron: true,
        rearApron: false,
        leftFrontApron: true,
        rightFrontApron: false,
        backsplashHeight: 10,
        apronHeight: 10,
      },
      island: {
        width: '2.00',
        depth: '1.10',
        sink: true,
        sinkType: 'sink-60cm' as const,
        sinkCenterX: 1.00,
        wetArea: false,
        wetWidth: '1.00',
        wetCenterX: 0.50,
        cooktop: false,
        cooktopType: 'cooktop-4' as const,
        cooktopCenterX: 1.40,
        backBacksplash: false,
        leftBacksplash: false,
        rightBacksplash: false,
        frontApron: true,
        rearApron: false,
        leftFrontApron: true,
        rightFrontApron: true,
        backsplashHeight: 10,
        apronHeight: 110,
      },
      islandGourmet: {
        width: '3.00',
        depth: '1.10',
        sink: false,
        sinkType: 'sink-60cm' as const,
        sinkCenterX: 0.60,
        wetArea: false,
        wetWidth: '1.00',
        wetCenterX: 0.50,
        cooktop: true,
        cooktopType: 'cooktop-4' as const,
        cooktopCenterX: 1.50,
        backBacksplash: false,
        leftBacksplash: false,
        rightBacksplash: false,
        frontApron: false,
        rearApron: false,
        leftFrontApron: false,
        rightFrontApron: false,
        backsplashHeight: 10,
        apronHeight: 10,
      },
      counter: {
        width: '1.50',
        depth: '0.40',
        sink: false,
        sinkType: 'sink-45cm' as const,
        sinkCenterX: 0.60,
        wetArea: false,
        wetWidth: '1.00',
        wetCenterX: 0.50,
        cooktop: false,
        cooktopType: 'cooktop-4' as const,
        cooktopCenterX: 1.40,
        backBacksplash: false,
        leftBacksplash: false,
        rightBacksplash: false,
        frontApron: true,
        rearApron: false,
        leftFrontApron: true,
        rightFrontApron: false,
        backsplashHeight: 10,
        apronHeight: 10,
      },
    }[preset];

    setWidth(presets.width);
    setDepth(presets.depth);

    setBackBacksplash(presets.backBacksplash);
    setLeftBacksplash(presets.leftBacksplash);
    setRightBacksplash(presets.rightBacksplash);
    setFrontApron(presets.frontApron);
    setRearApron(presets.rearApron);
    setLeftFrontApron(presets.leftFrontApron);
    setRightFrontApron(presets.rightFrontApron);
    setBackBsH(presets.backsplashHeight);
    setLeftBsH(presets.backsplashHeight);
    setRightBsH(presets.backsplashHeight);
    setFrontApronH(presets.apronHeight);
    setRearApronH(presets.apronHeight);
    setLeftApronH(presets.apronHeight);
    setRightApronH(presets.apronHeight);

    setSinkCutout((current) => ({
      ...current,
      enabled: presets.sink,
      type: presets.sinkType,
      centerX: presets.sinkCenterX,
    }));
    setCooktopCutout((current) => ({
      ...current,
      enabled: presets.cooktop,
      type: presets.cooktopType,
      centerX: presets.cooktopCenterX,
    }));

    setWetAreaEnabled(presets.wetArea);
    setWetWidth(presets.wetWidth);
    setWetCenterX(presets.wetCenterX);

    const presetStoneName = PRESET_STONE_NAMES[preset];
    if (presetStoneName) {
      const normalizedPresetStoneName = normalizeStoneName(presetStoneName);
      const presetStone = stones.find((stone) => (
        normalizeStoneName(stone.name) === normalizedPresetStoneName
        || normalizeStoneName(stone.name).includes(normalizedPresetStoneName.replace('granito ', ''))
      ));
      if (presetStone) {
        setStoneId(presetStone.id);
      }
    }

    setSelectedPreset(preset);
  }

  useEffect(() => {
    let mounted = true;

    async function loadSupabaseCatalog() {
      if (!hasSupabaseConfig) {
        if (mounted) {
          setStonesLoading(false);
          setStonesError('Supabase não configurado.');
        }
        return;
      }

      setStonesLoading(true);
      setStonesError('');

      try {
      const company = await fetchPublicCompany();

      if (!mounted) {
        return;
      }

      setCurrentCompany(company);

      if (company.id === fallbackCompany.id) {
        setStones([]);
        setCutoutServices([]);
        setStoneId('');
        setStonesLoading(false);
        setStonesError('Empresa pública não encontrada ou inativa.');
        return;
      }

      const [stonesResult, cutoutsResult] = await Promise.all([
        supabase
          .from('stones')
          .select('id, name, price_per_m2, image_url')
          .eq('company_id', company.id)
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('cutouts')
          .select('id, name, price')
          .eq('company_id', company.id)
          .eq('active', true),
      ]);

      if (!mounted) {
        return;
      }

      if (stonesResult.error) {
        setStonesLoading(false);
        setStonesError('Não foi possível carregar as pedras cadastradas.');
        return;
      }

      const nextStones = (stonesResult.data ?? []).map((stone) => ({
        id: stone.id,
        name: stone.name,
        pricePerM2: Number(stone.price_per_m2) || 0,
        texturePath: stone.image_url ?? null,
      }));

      setStones(nextStones);
      setStoneId((currentStoneId) => (
        nextStones.some((stone) => stone.id === currentStoneId)
          ? currentStoneId
          : nextStones[0]?.id ?? ''
      ));
      setStonesError('');
      setStonesLoading(false);

      if (cutoutsResult.error) {
        return;
      }

      setCutoutServices((cutoutsResult.data ?? []) as TechnicalServicePrice[]);
      } catch {
        if (mounted) {
          setCurrentCompany(null);
          setStones([]);
          setCutoutServices([]);
          setStoneId('');
          setStonesLoading(false);
          setStonesError('Não foi possível resolver a empresa pública.');
        }
      }
    }

    void loadSupabaseCatalog();

    return () => {
      mounted = false;
    };
  }, [publicCompanyIdentifier.cacheKey]);

  const pricingComponents = useMemo(() => {
    if (numWidth <= 0 || numDepth <= 0) {
      return [] as PricingComponentItem[];
    }

    const thicknessMultiplier = resolveThicknessMultiplier(thickness);
    const components: PricingComponentItem[] = [];
    const stonePieceInput = {
      pricePerM2: selectedStone?.pricePerM2 ?? 0,
      thicknessMultiplier,
    };

    if (backBacksplash) {
      components.push(buildStonePiecePrice({
        id: 'backsplashRear',
        label: 'Frontão traseiro',
        length: numWidth,
        heightCm: backBsH,
        ...stonePieceInput,
      }));
    }

    if (leftBacksplash) {
      components.push(buildStonePiecePrice({
        id: 'backsplashLeft',
        label: 'Frontão esquerdo',
        length: numDepth,
        heightCm: leftBsH,
        ...stonePieceInput,
      }));
    }

    if (rightBacksplash) {
      components.push(buildStonePiecePrice({
        id: 'backsplashRight',
        label: 'Frontão direito',
        length: numDepth,
        heightCm: rightBsH,
        ...stonePieceInput,
      }));
    }

    if (frontApron) {
      components.push(buildStonePiecePrice({
        id: 'skirtFront',
        label: 'Saia frontal',
        length: numWidth,
        heightCm: frontApronH,
        ...stonePieceInput,
      }));
    }

    if (rearApron) {
      components.push(buildStonePiecePrice({
        id: 'skirtRear',
        label: 'Saia traseira',
        length: numWidth,
        heightCm: rearApronH,
        ...stonePieceInput,
      }));
    }

    if (leftFrontApron) {
      components.push(buildStonePiecePrice({
        id: 'skirtLeft',
        label: 'Saia esquerda',
        length: numDepth,
        heightCm: leftApronH,
        ...stonePieceInput,
      }));
    }

    if (rightFrontApron) {
      components.push(buildStonePiecePrice({
        id: 'skirtRight',
        label: 'Saia direita',
        length: numDepth,
        heightCm: rightApronH,
        ...stonePieceInput,
      }));
    }

    if (wetAreaEnabled && wetAreaValid) {
      components.push(buildFixedComponentPrice({
        service: wetAreaCutoutService,
        fallbackId: 'wetArea',
        label: 'Área molhada',
      }));
    }

    if (sinkActive) {
      components.push(buildFixedComponentPrice({
        service: sinkCutoutService,
        fallbackId: 'sinkCutout',
        label: 'Cuba/recorte',
      }));
    }

    if (cooktopActive) {
      components.push(buildFixedComponentPrice({
        service: cooktopCutoutService,
        fallbackId: 'cooktopCutout',
        label: 'Cooktop',
      }));
    }

    return components;
  }, [
    numWidth,
    numDepth,
    thickness,
    selectedStone?.pricePerM2,
    backBacksplash,
    backBsH,
    leftBacksplash,
    leftBsH,
    rightBacksplash,
    rightBsH,
    frontApron,
    frontApronH,
    rearApron,
    rearApronH,
    leftFrontApron,
    leftApronH,
    rightFrontApron,
    rightApronH,
    wetAreaEnabled,
    wetAreaValid,
    sinkActive,
    sinkCutoutService,
    cooktopActive,
    cooktopCutoutService,
    wetAreaCutoutService,
  ]);

  const quote = useMemo(() => {
    if (numWidth <= 0 || numDepth <= 0 || !selectedStone) return buildEmptyQuoteResult();
    const result = calculateQuoteEstimate({
      stoneId: selectedStone.id,
      pricePerM2: selectedStone.pricePerM2,
      width: numWidth,
      depth: numDepth,
      thickness,
    });
    const extra = pricingComponents.reduce((total, component) => total + component.price, 0);
    const total = roundMoney(result.stonePrice + extra);
    return { ...result, total };
  }, [numWidth, numDepth, thickness, selectedStone, pricingComponents]);

  async function captureProjectImage(): Promise<ProjectImageSnapshot | null> {
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = previewRef.current?.querySelector('canvas');
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      return null;
    }

    const maxWidth = 960;
    const maxHeight = 420;
    const scale = Math.min(1, maxWidth / canvas.width, maxHeight / canvas.height);
    const outputWidth = Math.max(1, Math.round(canvas.width * scale));
    const outputHeight = Math.max(1, Math.round(canvas.height * scale));
    const output = document.createElement('canvas');
    output.width = outputWidth;
    output.height = outputHeight;

    const context = output.getContext('2d');
    if (!context) {
      return null;
    }

    context.fillStyle = '#f3f1ec';
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.drawImage(canvas, 0, 0, outputWidth, outputHeight);

    try {
      const dataUrl = output.toDataURL('image/png');
      return {
        type: 'image/png',
        dataUrl,
        width: outputWidth,
        height: outputHeight,
        sizeBytes: estimateDataUrlBytes(dataUrl),
      };
    } catch {
      return null;
    }
  }

  function buildConfigurationSnapshot(projectImage: ProjectImageSnapshot | null) {
    return {
      version: 1,
      source: 'countertop_configurator',
      ...(projectImage ? { projectImage } : {}),
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: trimOptional(customerEmail),
        city: trimOptional(customerCity),
      },
      countertop: {
        width: numWidth,
        depth: numDepth,
        thickness,
        stoneName: selectedStone?.name ?? null,
        stoneId: selectedStone?.id ?? null,
        pricePerM2: selectedStone?.pricePerM2 ?? null,
        totalPrice: quote.total,
      },
      components: {
        backsplashRear: { enabled: backBacksplash, height: backBsH },
        backsplashLeft: { enabled: leftBacksplash, height: leftBsH },
        backsplashRight: { enabled: rightBacksplash, height: rightBsH },
        skirtFront: { enabled: frontApron, height: frontApronH },
        skirtRear: { enabled: rearApron, height: rearApronH },
        skirtLeft: { enabled: leftFrontApron, height: leftApronH },
        skirtRight: { enabled: rightFrontApron, height: rightApronH },
        wetArea: {
          enabled: wetAreaEnabled && wetAreaValid,
          width: wetAreaEnabled && wetAreaValid ? numWetWidth : null,
          centerX: wetAreaEnabled && wetAreaValid ? wetCenterX : null,
          frontMargin: 0.04,
          backMargin: 0.02,
        },
        sink: {
          enabled: sinkActive,
          type: sinkActive ? sinkCutout.type : null,
          centerX: sinkActive ? globalSinkCenterX : null,
        },
        cooktop: {
          enabled: cooktopActive,
          type: cooktopActive ? cooktopCutout.type : null,
          centerX: cooktopActive ? cooktopCutout.centerX : null,
        },
      },
      pricing: {
        baseStone: quote.stonePrice,
        components: pricingComponents,
        total: quote.total,
      },
    };
  }

  async function handleSendProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!hasSupabaseConfig) {
      setSaveError('Supabase não configurado.');
      return;
    }

    if (!currentCompany || currentCompany.id === fallbackCompany.id) {
      setSaveError('Empresa pública não encontrada ou inativa.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setSaveError('Informe nome e telefone para enviar o projeto.');
      return;
    }

    if (numWidth <= 0 || numDepth <= 0 || quote.total < 0) {
      setSaveError('Revise as medidas do tampo antes de enviar.');
      return;
    }

    if (!selectedStone) {
      setSaveError('Nenhuma pedra ativa cadastrada. Cadastre uma pedra no Admin.');
      return;
    }

    setSavingProject(true);

    try {
      const projectImage = await captureProjectImage();
      const snapshot = buildConfigurationSnapshot(projectImage);
      const { data, error } = await supabase.rpc('create_3d_quote_with_item', {
        p_company_id: currentCompany.id,
        p_customer_name: customerName.trim(),
        p_customer_phone: customerPhone.trim(),
        p_customer_email: trimOptional(customerEmail),
        p_city: trimOptional(customerCity),
        p_total_price: quote.total,
        p_configuration_snapshot: snapshot,
      });

      if (error) {
        throw error;
      }

      setSaveSuccess(`Projeto enviado com sucesso. Pedido ${String(data).slice(0, 8)} criado.`);
    } catch {
      setSaveError('Não foi possível enviar o projeto. Verifique a conexão e as permissões do Supabase.');
    } finally {
      setSavingProject(false);
    }
  }

  return (
    <section className="-mt-3 space-y-2 sm:-mt-5">
      <div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { id: 'kitchen' as const, label: 'Pia', imagePath: '/presets/pia.webp' },
            { id: 'gourmet' as const, label: 'Gourmet', imagePath: '/presets/gourmet.webp' },
            { id: 'bathroom' as const, label: 'Banheiro', imagePath: '/presets/banheiro.webp' },
            { id: 'island' as const, label: 'Ilha', imagePath: '/presets/ilha.webp' },
            { id: 'counter' as const, label: 'Balcão', imagePath: '/presets/balcao.webp' },
            { id: 'laundry' as const, label: 'Lavanderia', imagePath: '/presets/lavanderia.webp' },
          ].map((preset) => (
            <PresetCard
              key={preset.id}
              label={preset.label}
              imagePath={preset.imagePath}
              selected={selectedPreset === preset.id}
              onClick={() => applyPreset(preset.id)}
            />
          ))}
        </div>
      </div>

      {/* Layout: Preview 3D com painéis flutuantes */}
      <div className="relative grid gap-4 lg:block">
        {/* ── Coluna esquerda: Componentes ──────────────────────── */}
        <div className="space-y-4 lg:absolute lg:left-4 lg:top-16 lg:z-10 lg:w-[200px]">
          <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/22 p-3 shadow-[0_18px_45px_rgba(31,41,51,0.12)] backdrop-blur-md">
            <div className="space-y-2">
              <ToggleButton icon="🧱" label="Frontão traseiro" active={backBacksplash} valueLabel={backBacksplash ? `${backBsH}cm` : undefined} onClick={() => setBackBacksplash(!backBacksplash)} />
              {backBacksplash && (
                <div className="px-2.5 pb-1">
                  <HeightInput label="Altura" value={backBsH} onChange={setBackBsH} />
                </div>
              )}
              <ToggleButton icon="🧱" label="Frontão esquerdo" active={leftBacksplash} valueLabel={leftBacksplash ? `${leftBsH}cm` : undefined} onClick={() => setLeftBacksplash(!leftBacksplash)} />
              {leftBacksplash && (
                <div className="px-2.5 pb-1">
                  <HeightInput label="Altura" value={leftBsH} onChange={setLeftBsH} />
                </div>
              )}
              <ToggleButton icon="🧱" label="Frontão direito" active={rightBacksplash} valueLabel={rightBacksplash ? `${rightBsH}cm` : undefined} onClick={() => setRightBacksplash(!rightBacksplash)} />
              {rightBacksplash && (
                <div className="px-2.5 pb-1">
                  <HeightInput label="Altura" value={rightBsH} onChange={setRightBsH} />
                </div>
              )}
              <ToggleButton icon="🪵" label="Saia frontal" active={frontApron} valueLabel={frontApron ? `${frontApronH}cm` : undefined} onClick={() => setFrontApron(!frontApron)} />
              {frontApron && (
                <div className="px-2.5 pb-1">
                  <HeightInput label="Altura" value={frontApronH} onChange={setFrontApronH} />
                </div>
              )}
              <ToggleButton icon="🪵" label="Saia traseira" active={rearApron} valueLabel={rearApron ? `${rearApronH}cm` : undefined} onClick={() => setRearApron(!rearApron)} />
              {rearApron && (
                <div className="px-2.5 pb-1">
                  <HeightInput label="Altura" value={rearApronH} onChange={setRearApronH} />
                </div>
              )}
              <ToggleButton icon="🪵" label="Saia esquerda" active={leftFrontApron} valueLabel={leftFrontApron ? `${leftApronH}cm` : undefined} onClick={() => setLeftFrontApron(!leftFrontApron)} />
              {leftFrontApron && (
                <div className="px-2.5 pb-1">
                  <HeightInput label="Altura" value={leftApronH} onChange={setLeftApronH} />
                </div>
              )}
              <ToggleButton icon="🪵" label="Saia direita" active={rightFrontApron} valueLabel={rightFrontApron ? `${rightApronH}cm` : undefined} onClick={() => setRightFrontApron(!rightFrontApron)} />
              {rightFrontApron && (
                <div className="px-2.5 pb-1">
                  <HeightInput label="Altura" value={rightApronH} onChange={setRightApronH} />
                </div>
              )}
              <ToggleButton icon="🪠" label="Cuba" active={sinkActive} onClick={() => setSinkCutout(s => s.enabled ? { ...s, enabled: false } : { ...s, enabled: true, centerX: 0.60 })} />
              {sinkActive && (
                <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                  {(['sink-45cm', 'sink-60cm'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSinkCutout(s => ({ ...s, type }))}
                      className={[
                        'rounded-full border px-2 py-1 text-[10px] font-semibold transition',
                        sinkCutout.type === type
                          ? 'border-moss/45 bg-moss/10 text-moss'
                          : 'border-white/55 bg-white/55 text-stone-600 hover:border-moss/25 hover:bg-white/80',
                      ].join(' ')}
                    >
                      {type === 'sink-45cm' ? 'Recorte 45cm' : 'Recorte 60cm'}
                    </button>
                  ))}
                </div>
              )}
              <ToggleButton icon="🔥" label="Cooktop" active={cooktopActive} onClick={() => setCooktopCutout(c => c.enabled ? { ...c, enabled: false } : { ...c, enabled: true, centerX: 1.40 })} />
              {cooktopActive && (
                <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                  {(['cooktop-4', 'cooktop-5'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCooktopCutout(c => ({ ...c, type }))}
                      className={[
                        'rounded-full border px-2 py-1 text-[10px] font-semibold transition',
                        cooktopCutout.type === type
                          ? 'border-moss/45 bg-moss/10 text-moss'
                          : 'border-white/55 bg-white/55 text-stone-600 hover:border-moss/25 hover:bg-white/80',
                      ].join(' ')}
                    >
                      {type === 'cooktop-4' ? '4 bocas (50cm)' : '5 bocas (75cm)'}
                    </button>
                  ))}
                </div>
              )}
              <ToggleButton icon="💧" label="Área molhada" active={wetAreaEnabled} valueLabel={wetAreaEnabled ? `${numWetWidth.toFixed(2).replace('.', ',')}m` : undefined} onClick={handleToggleWetArea} />
              {wetAreaEnabled && (
                <div className="px-2.5 pb-1">
                  <input
                    type="range"
                    min="0.20"
                    max={numWidth.toFixed(2)}
                    step="0.01"
                    value={wetWidth}
                    onChange={(event) => setWetWidth(event.target.value)}
                    className="component-height-slider w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Centro: Preview 3D ────────────────────────────────── */}
        <div ref={previewRef} className="surface-card overflow-hidden">
          <div className="relative">
            <ThreeDPreview
              width={numWidth}
              depth={numDepth}
              thickness={thickness}
              stoneName={selectedStone?.name ?? 'Sem pedra cadastrada'}
              stoneImageUrl={selectedStone?.texturePath ?? undefined}
              cameraResetKey={selectedPreset ?? 'default'}
              backsplashEnabled={backBacksplash}
              backsplashHeightCm={backBsH}
              leftBacksplashEnabled={leftBacksplash}
              leftBacksplashHeightCm={leftBsH}
              rightBacksplashEnabled={rightBacksplash}
              rightBacksplashHeightCm={rightBsH}
              frontApronEnabled={frontApron}
              frontApronHeightCm={frontApronH}
              rearApronEnabled={rearApron}
              rearApronHeightCm={rearApronH}
              leftFrontApronEnabled={leftFrontApron}
              leftFrontApronHeightCm={leftApronH}
              rightFrontApronEnabled={rightFrontApron}
              rightFrontApronHeightCm={rightApronH}
              sinkEnabled={sinkEnabled}
              cutoutEnabled={anyCutoutActive}
              cutoutComponentId={undefined}
              cutoutPosition={undefined}
              sinkCutoutComponentId={sinkActive ? CUTOUT_SIZES[sinkCutout.type].componentId : undefined}
              sinkCutoutPosition={sinkActive ? { x: globalSinkCenterX - numWidth / 2, z: 0 } : undefined}
              cooktopCutoutComponentId={cooktopActive ? CUTOUT_SIZES[cooktopCutout.type].componentId : undefined}
              cooktopCutoutPosition={cooktopActive ? { x: cooktopCutout.centerX - numWidth / 2, z: 0 } : undefined}
              wetAreaEnabled={wetAreaEnabled && wetAreaValid}
              wetAreaWidth={wetAreaValid ? numWetWidth : undefined}
              wetAreaDepth={wetAreaValid ? numDepth : undefined}
              wetAreaPosition={{ x: wetAreaValid ? wetCenterX - numWidth / 2 : undefined }}
              edgeFinishType="straight"
            />
            <div className="absolute left-4 right-4 top-2 z-10 px-1 py-0 lg:left-[232px] lg:right-[292px]">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-0.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold uppercase text-stone-500">Largura</span>
                    <span className="font-semibold text-graphite">{numWidth.toFixed(2)}m</span>
                  </div>
                  <input
                    className="component-height-slider w-full"
                    type="range"
                    min="0.80"
                    max="3.50"
                    step="0.01"
                    value={width}
                    onChange={(event) => setWidth(event.target.value)}
                  />
                </label>
                <label className="space-y-0.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold uppercase text-stone-500">Profundidade</span>
                    <span className="font-semibold text-graphite">{numDepth.toFixed(2)}m</span>
                  </div>
                  <input
                    className="component-height-slider w-full"
                    type="range"
                    min="0.40"
                    max="1.20"
                    step="0.01"
                    value={depth}
                    onChange={(event) => setDepth(event.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Coluna direita: Pedras ────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/22 shadow-[0_18px_45px_rgba(31,41,51,0.12)] backdrop-blur-md lg:absolute lg:right-4 lg:top-4 lg:z-10 lg:w-[260px]">
          <div className="max-h-[500px] overflow-y-auto p-3">
            {stonesLoading ? (
              <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
                Carregando pedras cadastradas...
              </p>
            ) : stonesError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {stonesError}
              </p>
            ) : stones.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Nenhuma pedra ativa cadastrada. Cadastre uma pedra no Admin.
              </p>
            ) : (
              <div className="space-y-2">
                {stones.map((stone) => (
                  <button
                    key={stone.id}
                    type="button"
                    onClick={() => setStoneId(stone.id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl border p-2.5 text-left shadow-[0_8px_22px_rgba(31,41,51,0.06)] transition',
                      stoneId === stone.id
                        ? 'border-moss/55 bg-white/92 ring-1 ring-moss/20'
                        : 'border-white/55 bg-white/72 hover:border-moss/25 hover:bg-white/90',
                    ].join(' ')}
                  >
                    {stone.texturePath ? (
                      <img src={stone.texturePath} alt={stone.name} className="h-14 w-14 flex-none rounded-lg object-cover shadow-[0_6px_16px_rgba(31,41,51,0.18)] ring-1 ring-black/5" />
                    ) : (
                      <div className="h-14 w-14 flex-none rounded-lg bg-gradient-to-br from-stone-300 via-stone-200 to-stone-400 shadow-[0_6px_16px_rgba(31,41,51,0.18)] ring-1 ring-black/5" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold leading-tight text-graphite">{stone.name}</span>
                      <span className="mt-1 block text-[11px] text-stone-500">{formatCurrency(stone.pricePerM2)}/m²</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="surface-card p-4">
          <UnifiedPositionRuler
            totalWidth={numWidth}
            wetArea={{
              enabled: wetAreaEnabled,
              valid: wetAreaValid,
              width: numWetWidth,
              centerX: wetCenterX,
              onChange: setWetCenterX,
            }}
            sink={{
              enabled: sinkActive,
              width: CUTOUT_SIZES[sinkCutout.type].width,
              centerX: globalSinkCenterX,
              minCenter: sinkBoundsOffset + CUTOUT_SIZES[sinkCutout.type].width / 2,
              maxCenter: sinkBoundsOffset + sinkBoundsWidth - CUTOUT_SIZES[sinkCutout.type].width / 2,
              onChange: (x) => setSinkCutout(s => ({ ...s, centerX: x - sinkBoundsOffset })),
            }}
            cooktop={{
              enabled: cooktopActive,
              width: CUTOUT_SIZES[cooktopCutout.type].width,
              centerX: cooktopCutout.centerX,
              minCenter: CUTOUT_SIZES[cooktopCutout.type].width / 2,
              maxCenter: numWidth - CUTOUT_SIZES[cooktopCutout.type].width / 2,
              onChange: (x) => setCooktopCutout(c => ({ ...c, centerX: x })),
            }}
          />
        </div>
        <form className="surface-card flex flex-col gap-3 p-4" onSubmit={handleSendProject}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Nome</span>
              <input
                className="field-input"
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Nome do cliente"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Telefone</span>
              <input
                className="field-input"
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="WhatsApp"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-stone-500">E-mail opcional</span>
              <input
                className="field-input"
                type="email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                placeholder="cliente@email.com"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-stone-500">Cidade opcional</span>
              <input
                className="field-input"
                type="text"
                value={customerCity}
                onChange={(event) => setCustomerCity(event.target.value)}
                placeholder="Cidade"
              />
            </label>
          </div>

          {saveError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </p>
          )}

          {saveSuccess && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {saveSuccess}
            </p>
          )}

          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-stone-500">Preço estimado</p>
            <p className="text-2xl font-bold text-graphite">{formatCurrency(quote.total)}</p>
          </div>
          <button
            type="submit"
            className="primary-button w-full whitespace-nowrap text-center disabled:cursor-not-allowed disabled:opacity-60"
            disabled={savingProject || !selectedStone}
          >
            {savingProject ? 'Enviando...' : 'Enviar projeto'}
          </button>
        </form>
      </div>
    </section>
  );
}
