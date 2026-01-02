/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1e40af', // primary
          mid: '#2563eb',
          sky: '#60a5fa',
          purple: '#7c3aed',
          orange: '#fb923c',
        },
        ui: {
          surface: '#ffffff',
          muted: '#64748b',
          border: '#e6edf3',
        },
        dashboard: {
          indigo1: '#1e1b4b',
          indigo2: '#312e81',
        },
      },
      boxShadow: {
        'card-sm': '0 6px 20px rgba(2,6,23,0.08)',
      },
      borderRadius: {
        'xl-2': '1rem',
      },
    },
  },
  plugins: [],
};

