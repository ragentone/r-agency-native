import '../global.css';

import {Stack} from 'expo-router';

import {MeshProvider} from '@/core/mesh';

export default function RootLayout() {
  return (
    <MeshProvider>
      <Stack/>
    </MeshProvider>
  );
}
