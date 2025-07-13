import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/assistant');
  // The redirect function will stop rendering, so returning null or anything else is not strictly necessary here.
}
