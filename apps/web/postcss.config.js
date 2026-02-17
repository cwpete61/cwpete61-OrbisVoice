/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'orbit-blue': '#0B1B3B',
        'signal-cyan': '#37CBEA',
        'plasma-orange': '#FF7A3D',
        'aurora-green': '#2ED59D',
        'void': '#060B14',
        'slate': '#1C2433',
        'mist': '#E6EDF5',
      },
    },
  },
  plugins: [],
};
