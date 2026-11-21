import { Redirect } from 'expo-router';

/** Stary dashboard → menu kołowe. */
export default function DashboardRedirect() {
  return <Redirect href="/home" />;
}
