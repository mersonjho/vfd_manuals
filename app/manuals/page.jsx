import { readFileSync } from 'fs';
import { join } from 'path';
import ManualList from '../../components/manuals/manuals-view';

export default function ManualsPage() {
  // Read data server-side — NEVER bundled into client JS
  const raw = readFileSync(join(process.cwd(), 'data', 'manuals.json'), 'utf-8');
  const data = JSON.parse(raw);

  return <ManualList data={data} />;
}
