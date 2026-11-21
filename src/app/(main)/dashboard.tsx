import { Redirect } from 'expo-router';

/** Stary adres „Mój plan” → Moje świadczenia. */
export default function DashboardRedirect() {
  return <Redirect href="/benefits" />;
}
