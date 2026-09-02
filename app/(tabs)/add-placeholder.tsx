import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

export default function AddPlaceholder() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/modal/add-transaction');
  }, [router]);

  return <View style={{ flex: 1, backgroundColor: '#0b0f19' }} />;
}
