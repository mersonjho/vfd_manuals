import { readFileSync } from 'fs';
import { join } from 'path';
import { notFound } from 'next/navigation';
import VfdDetailClient from './client';

export function generateStaticParams() {
  const raw = readFileSync(join(process.cwd(), 'data', 'vfd.json'), 'utf-8');
  const data = JSON.parse(raw);
  return Object.keys(data.models).map(id => ({ id }));
}

export default function VfdPage({ params }) {
  const raw = readFileSync(join(process.cwd(), 'data', 'vfd.json'), 'utf-8');
  const data = JSON.parse(raw);
  const model = data.models[params.id];
  if (!model) notFound();

  return <VfdDetailClient model={model} universal={data.universal} />;
}
