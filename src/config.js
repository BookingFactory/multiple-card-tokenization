export const API_ENDPOINT = process.env.NODE_ENV === 'production'
  ? (window.API_ENDPOINT || "https://app.thebookingfactory.com") + '/api/public'
  : 'https://app.thebookingfactory.com/api/public';
