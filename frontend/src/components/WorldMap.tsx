import { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';

// TopoJSON from a reliable CDN
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface LocationData {
  country: string;
  count: number;
  percent: number;
}

interface WorldMapProps {
  data: LocationData[];
}

export default function WorldMap({ data }: WorldMapProps) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map(d => d.count), 1);
  }, [data]);

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) => (
            <>
              {geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#EAEAEA"
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#EAEAEA" },
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
                // Handle cases where centroid cannot be calculated accurately
                if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null;

                // Scale sphere radius dynamically
                const r = Math.max(4, (d.count / maxCount) * 16);

                return (
                  <Marker key={`${geo.rsmKey}-marker`} coordinates={centroid}>
                    <circle 
                      r={r} 
                      fill="rgba(16, 185, 129, 0.8)" 
                      stroke="#FFFFFF" 
                      strokeWidth={1} 
                      className="dark:stroke-d-bg-base transition-all duration-300 hover:scale-110 hover:fill-emerald-500 cursor-pointer"
                    />
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