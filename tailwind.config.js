module.exports = {
  purge: {
    enabled: true,
    content: ['public/index.html', './public/js/main.js'],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: '#0036ad',
        secondary: '#04002b',
      },
      borderRadius: {
        '1/2': '50%',
      },
      gridTemplateColumns: {
        dim: '2fr 2fr 2fr 2fr 1fr',
        results: 'repeat(auto-fit, minmax(300px, 1fr));',
        '2/3': '2fr 3fr',
      },
      width: {
        product: '90vw',
        productLg: '80vw',
        productXl: '65vw',
      },
    },
    container: {
      center: true,
      padding: '1rem',
    },
    maxWidth: {
      '1/4': '25%',
      '1/3': '33%',
      '1/2': '50%',
      '3/4': '75%',
      '400px': '400px',
      '350px': '350px',
      '300px': '300px',
      '200px': '200px',
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
