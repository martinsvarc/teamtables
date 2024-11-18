export function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : `https://${process.env.VERCEL_URL}`;
}
