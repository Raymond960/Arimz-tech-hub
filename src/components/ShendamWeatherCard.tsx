import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSun, Wind, Droplets, RefreshCw, ChevronDown } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  code: number;
  time: string;
}

export const ShendamWeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 31,
    condition: 'Sunny & Warm',
    humidity: 38,
    windSpeed: 11,
    code: 0,
    time: 'Shendam Central'
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchWeather = async (force: boolean = false) => {
    try {
      const WEATHER_CACHE_KEY = 'shendam_weather_cache_v1';
      const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

      // Check localStorage cache unless force update requested
      if (!force) {
        const cached = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
              setWeather(data);
              return;
            }
          } catch {
            // cache corrupt, proceed to fetch
          }
        }
      }

      setLoading(true);

      // Try local API route first, fallback to direct OpenMeteo
      let fetchedData: WeatherData | null = null;
      try {
        const apiRes = await fetch('/api/weather');
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          fetchedData = {
            temp: apiData.temp,
            condition: apiData.condition,
            humidity: apiData.humidity,
            windSpeed: apiData.windSpeed,
            code: apiData.code,
            time: 'Shendam Central'
          };
        }
      } catch {
        // Fallback to direct fetch
      }

      if (!fetchedData) {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=8.88&longitude=9.50&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Africa%2FLagos'
        );
        if (res.ok) {
          const data = await res.json();
          const current = data.current;
          let conditionText = 'Clear & Sunny';
          const code = current?.weather_code ?? 0;
          if (code === 0) conditionText = 'Clear & Sunny';
          else if (code === 1 || code === 2) conditionText = 'Partly Cloudy';
          else if (code === 3) conditionText = 'Overcast';
          else if (code >= 51 && code <= 67) conditionText = 'Scattered Showers';
          else if (code >= 80 && code <= 99) conditionText = 'Rain Storm';
          else if (code >= 45 && code <= 48) conditionText = 'Hazy / Harmattan';

          fetchedData = {
            temp: Math.round(current?.temperature_2m ?? 31),
            condition: conditionText,
            humidity: Math.round(current?.relative_humidity_2m ?? 40),
            windSpeed: Math.round(current?.wind_speed_10m ?? 12),
            code: code,
            time: 'Shendam Central'
          };
        }
      }

      if (fetchedData) {
        setWeather(fetchedData);
        localStorage.setItem(
          WEATHER_CACHE_KEY,
          JSON.stringify({ data: fetchedData, timestamp: Date.now() })
        );
      }
    } catch {
      // Keep existing weather state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-4 h-4 text-[#FFC928] animate-[spin_12s_linear_infinite]" />;
    if (code === 1 || code === 2) return <CloudSun className="w-4 h-4 text-[#FFC928]" />;
    if (code >= 51) return <CloudRain className="w-4 h-4 text-[#38BDF8]" />;
    return <Cloud className="w-4 h-4 text-[#D5DCE8]" />;
  };

  return (
    <div className="px-4 mb-2.5 z-20">
      <div 
        id="shendam-weather-pill"
        onClick={() => setExpanded(!expanded)}
        className="weather-card-container w-full bg-[#0B2D5C]/80 hover:bg-[#0B2D5C] border border-white/16 hover:border-[#F5B800]/50 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-1 select-none"
      >
        <div className="flex items-center justify-between">
          {/* Left: Location & Icon */}
          <div className="flex items-center gap-2">
            <div className="weather-icon-circle w-6 h-6 rounded-full bg-[#08254D] border border-[#F5B800]/30 flex items-center justify-center">
              {getWeatherIcon(weather.code)}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="weather-city-text text-[11px] font-bold text-white tracking-wide">
                Shendam
              </span>
              <span className="text-[10px] text-[#9BAABD]">•</span>
              <span className="weather-condition-text text-[11px] font-medium text-[#D5DCE8]">
                {weather.condition}
              </span>
            </div>
          </div>

          {/* Right: Temperature & Expand Icon */}
          <div className="flex items-center gap-2">
            <span className="weather-temp-text text-xs font-black text-[#FFC928] tracking-tight">
              {weather.temp}°C
            </span>
            <ChevronDown className={`weather-chevron w-3.5 h-3.5 text-[#9BAABD] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expanded Details on Click */}
        {expanded && (
          <div className="weather-details-text pt-2 pb-1 border-t border-white/16 flex items-center justify-between text-[10px] text-[#9BAABD] animate-in fade-in duration-150">
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-[#38BDF8]" />
              <span>Humidity: <strong className="weather-details-strong text-white">{weather.humidity}%</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-[#D5DCE8]" />
              <span>Wind: <strong className="weather-details-strong text-white">{weather.windSpeed} km/h</strong></span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchWeather(true);
              }}
              disabled={loading}
              className="flex items-center gap-1 text-[#FFC928] hover:text-[#0B4B8A] transition cursor-pointer font-bold"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Update</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
