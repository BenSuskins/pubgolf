import { getServerRandomiseOptions } from '@/lib/api';
import { getServerGameSession } from '@/lib/serverGameSession';
import RandomiseScreen from './RandomiseScreen';

export default async function RandomisePage() {
  const [, options] = await Promise.all([getServerGameSession(), getServerRandomiseOptions()]);
  return <RandomiseScreen initialOptions={options.options} />;
}
