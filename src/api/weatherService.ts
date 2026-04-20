const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;

export interface WeatherData {
  tempF: number;
  humidity: number;   // 0–100
  description: string; // e.g. "clear sky", "light rain"
  icon: string;       // emoji representation
}

/** Map OpenWeatherMap icon codes to emojis */
function iconCodeToEmoji(code: string): string {
  const id = code.slice(0, 2);
  switch (id) {
    case '01': return '☀️';
    case '02': return '🌤️';
    case '03': return '⛅';
    case '04': return '☁️';
    case '09': return '🌧️';
    case '10': return '🌦️';
    case '11': return '⛈️';
    case '13': return '❄️';
    case '50': return '🌫️';
    default:   return '🌡️';
  }
}

/** Fetch current weather for given coordinates */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  if (!API_KEY) throw new Error('No OpenWeatherMap API key configured');

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json() as {
    main: { temp: number; humidity: number };
    weather: Array<{ description: string; icon: string }>;
  };

  return {
    tempF: Math.round(data.main.temp),
    humidity: data.main.humidity,
    description: data.weather[0]?.description ?? '',
    icon: iconCodeToEmoji(data.weather[0]?.icon ?? '01d'),
  };
}

/** Wrap geolocation in a Promise */
export function getLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }, // cache location for 5 min
    );
  });
}
