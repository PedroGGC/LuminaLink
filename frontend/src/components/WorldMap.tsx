import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface LocationData {
  country: string;
  count: number;
  percent: number;
}

interface TooltipState {
  x: number;
  y: number;
  country: string;
  count: number;
  percent: number;
}

interface WorldMapProps {
  data: LocationData[];
}

export default function WorldMap({ data }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const maxCount = useMemo(() => {
    return Math.max(...data.map(d => d.count), 1);
  }, [data]);

  return (
    <div className="w-full relative" style={{ minHeight: 300 }}>
      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 bg-text-main dark:bg-d-bg-surface text-bg-base dark:text-d-text-main text-xs rounded-[6px] px-3 py-2 shadow-lg border border-transparent dark:border-d-border-subtle"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <p className="font-semibold mb-0.5">{tooltip.country}</p>
          <p className="opacity-70">{tooltip.count} {tooltip.count === 1 ? 'click' : 'clicks'} · {tooltip.percent}%</p>
        </div>
      )}

      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) => (
            <>
              {geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#C8C8C8"
                  stroke="#F5F5F5"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#B0B0B0" },
                    pressed: { outline: "none" },
                  }}
                  className="dark:fill-d-border-subtle dark:stroke-d-bg-base"
                />
              ))}

              {geographies.map((geo) => {
                const geoName = geo.properties.name;
                const d = data.find(
                  (item) =>
                    item.country === geoName ||
                    (item.country === "United States" && geoName === "United States of America")
                );

                if (!d) return null;

                const centroid = geoCentroid(geo);
                if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null;

                const r = Math.max(4, (d.count / maxCount) * 18);

                return (
                  <Marker
                    key={`${geo.rsmKey}-marker`}
                    coordinates={centroid}
                  >
                    <circle
                      r={r}
                      fill="rgba(16, 185, 129, 0.8)"
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                      className="dark:stroke-d-bg-base transition-all duration-200 cursor-pointer hover:fill-emerald-400"
                      style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }}
                      onMouseEnter={(e) => {
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          country: d.country,
                          count: d.count,
                          percent: d.percent,
                        });
                      }}
                      onMouseMove={(e) => {
                        setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {/* Pulse ring for top country */}
                    {d.count === maxCount && (
                      <circle
                        r={r + 4}
                        fill="none"
                        stroke="rgba(16, 185, 129, 0.35)"
                        strokeWidth={2}
                        className="animate-ping"
                        style={{ transformOrigin: '0 0' }}
                        pointerEvents="none"
                      />
                    )}
                  </Marker>
                );
              })}
            </>
          )}
        </Geographies>
      </ComposableMap>
    </div>
  );
}
