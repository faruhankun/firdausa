import { About } from './About';

export default async function Page({
  params,
}: {
  params: { username: string };
}) {
  return <About />;
}