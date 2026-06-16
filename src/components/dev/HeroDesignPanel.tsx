import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'hero-design-panel';

type HeroDesignConfig = {
  heroHeight: number;
  cardWidth: number;
  cardHeight: number;
  cardPadding: number;
  cardRadius: number;
  cardOpacity: number;
  cardBlur: number;
  cardShadow: number;
  cardX: number;
  cardY: number;
  titleSize: number;
  titleLineHeight: number;
  titleWidth: number;
  titleLetterSpacing: number;
  subtitleSize: number;
  subtitleWidth: number;
  buttonHeight: number;
  buttonWidth: number;
  buttonGap: number;
  buttonRadius: number;
  imageOverlayDark: number;
  imageOverlayLight: number;
  imageBrightness: number;
  imageContrast: number;
  imageSaturation: number;
};

const defaultConfig: HeroDesignConfig = {
  heroHeight: 500,
  cardWidth: 452,
  cardHeight: 426,
  cardPadding: 20,
  cardRadius: 48,
  cardOpacity: 0.4,
  cardBlur: 7,
  cardShadow: 17,
  cardX: 35,
  cardY: 0,
  titleSize: 40,
  titleLineHeight: 0.95,
  titleWidth: 250,
  titleLetterSpacing: 0.02,
  subtitleSize: 12,
  subtitleWidth: 342,
  buttonHeight: 43,
  buttonWidth: 320,
  buttonGap: 1,
  buttonRadius: 11,
  imageOverlayDark: 0,
  imageOverlayLight: 0,
  imageBrightness: 1,
  imageContrast: 1,
  imageSaturation: 1,
};

function loadInitialConfig(): HeroDesignConfig {
  if (typeof window === 'undefined') {
    return defaultConfig;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...JSON.parse(stored),
    };
  } catch {
    return defaultConfig;
  }
}

function setCssVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value);
}

function applyConfig(config: HeroDesignConfig) {
  const shadowBlur = Math.round(config.cardShadow * 2.67);

  setCssVar('--hero-height', `${config.heroHeight}px`);
  setCssVar('--hero-card-width', `${config.cardWidth}px`);
  setCssVar('--hero-card-height', `${config.cardHeight}px`);
  setCssVar('--hero-card-padding', `${config.cardPadding}px`);
  setCssVar('--hero-card-radius', `${config.cardRadius}px`);
  setCssVar('--hero-card-opacity', String(config.cardOpacity));
  setCssVar('--hero-card-blur', `${config.cardBlur}px`);
  setCssVar(
    '--hero-card-shadow',
    `0 ${config.cardShadow}px ${shadowBlur}px rgba(0,0,0,0.12)`,
  );
  setCssVar('--hero-card-x', `${config.cardX}px`);
  setCssVar('--hero-card-y', `${config.cardY}px`);
  setCssVar('--hero-title-size', `${config.titleSize}px`);
  setCssVar('--hero-title-line-height', String(config.titleLineHeight));
  setCssVar('--hero-title-width', `${config.titleWidth}px`);
  setCssVar('--hero-title-letter-spacing', `${config.titleLetterSpacing}em`);
  setCssVar('--hero-subtitle-size', `${config.subtitleSize}px`);
  setCssVar('--hero-subtitle-width', `${config.subtitleWidth}px`);
  setCssVar('--hero-button-height', `${config.buttonHeight}px`);
  setCssVar('--hero-button-width', `${config.buttonWidth}px`);
  setCssVar('--hero-button-gap', `${config.buttonGap}px`);
  setCssVar('--hero-button-radius', `${config.buttonRadius}px`);
  setCssVar('--hero-overlay-dark', String(config.imageOverlayDark));
  setCssVar('--hero-overlay-light', String(config.imageOverlayLight));
  setCssVar('--hero-image-brightness', String(config.imageBrightness));
  setCssVar('--hero-image-contrast', String(config.imageContrast));
  setCssVar('--hero-image-saturation', String(config.imageSaturation));
}

export function HeroDesignPanel() {
  const [config, setConfig] = useState<HeroDesignConfig>(loadInitialConfig);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    applyConfig(config);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config, null, 2));
  }, [config]);

  const sections = useMemo(
    () => [
      {
        title: 'Card',
        controls: [
          control('cardWidth', 'Largura do card', 300, 900),
          control('cardHeight', 'Altura do card', 300, 900),
          control('cardPadding', 'Padding interno', 20, 120),
          control('cardRadius', 'Border radius', 0, 60),
          control('cardOpacity', 'Transparencia', 0.1, 1, 0.05),
          control('cardBlur', 'Blur', 0, 40),
          control('cardShadow', 'Sombra', 0, 80),
        ],
      },
      {
        title: 'Posicionamento',
        controls: [
          control('cardX', 'Posicao X', 0, 300),
          control('cardY', 'Posicao Y', 0, 300),
        ],
      },
      {
        title: 'Titulo',
        controls: [
          control('titleSize', 'Tamanho da fonte', 40, 120),
          control('titleLineHeight', 'Line-height', 0.7, 1.4, 0.05),
          control('titleWidth', 'Largura maxima', 250, 900),
          control('titleLetterSpacing', 'Letter-spacing', -0.1, 0.1, 0.01),
        ],
      },
      {
        title: 'Subtitulo',
        controls: [
          control('subtitleSize', 'Tamanho do subtitulo', 12, 36),
          control('subtitleWidth', 'Largura maxima', 200, 800),
        ],
      },
      {
        title: 'Botoes',
        controls: [
          control('buttonHeight', 'Altura dos botoes', 40, 90),
          control('buttonWidth', 'Largura dos botoes', 120, 320),
          control('buttonGap', 'Espacamento', 0, 60),
          control('buttonRadius', 'Border radius', 0, 30),
        ],
      },
      {
        title: 'Imagem',
        controls: [
          control('imageOverlayDark', 'Overlay escuro', 0, 0.5, 0.05),
          control('imageOverlayLight', 'Overlay claro', 0, 0.5, 0.05),
          control('imageBrightness', 'Brilho', 0.5, 1.5, 0.05),
          control('imageContrast', 'Contraste', 0.5, 1.5, 0.05),
          control('imageSaturation', 'Saturacao', 0.5, 1.5, 0.05),
        ],
      },
      {
        title: 'Hero',
        controls: [control('heroHeight', 'Altura total do Hero', 500, 1000)],
      },
    ],
    [],
  );

  function updateValue(field: keyof HeroDesignConfig, value: number) {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function copyConfig() {
    const payload = JSON.stringify(config, null, 2);
    await navigator.clipboard.writeText(payload);
    setCopyMessage('Copiado');
    window.setTimeout(() => setCopyMessage(''), 1500);
  }

  return (
    <aside className="fixed bottom-5 right-5 z-[9999] max-h-[80vh] w-[340px] overflow-y-auto rounded-xl border border-stoneLine bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="border-b border-stoneLine pb-3">
        <h2 className="text-sm font-bold tracking-[0.18em] text-graphite">
          HERO DESIGN PANEL
        </h2>
        <p className="mt-1 text-xs text-stone-600">
          Ajustes temporários de layout
        </p>
      </div>

      <div className="mt-4 space-y-5">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-moss">
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.controls.map((item) => (
                <SliderControl
                  key={item.field}
                  label={item.label}
                  max={item.max}
                  min={item.min}
                  step={item.step}
                  value={config[item.field]}
                  onChange={(value) => updateValue(item.field, value)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        className="mt-5 w-full rounded-lg bg-graphite px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white"
        type="button"
        onClick={copyConfig}
      >
        {copyMessage || 'Copiar configuracao'}
      </button>
    </aside>
  );
}

function control(
  field: keyof HeroDesignConfig,
  label: string,
  min: number,
  max: number,
  step = 1,
) {
  return { field, label, min, max, step };
}

function SliderControl({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex items-center justify-between gap-3 text-xs font-medium text-stone-700">
        <span>{label}</span>
        <span className="font-mono text-[11px] text-stone-500">{value}</span>
      </span>
      <input
        className="w-full accent-graphite"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
