import { supabase } from '@/src/lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        if (error) {
          setOk(false);
          setMessage(error.message);
        } else {
          setOk(true);
          setMessage('Supabase connected. Schema reachable.');
        }
      } catch (err: any) {
        setOk(false);
        setMessage(err?.message || 'Unknown error');
      }
    }

    testConnection();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {ok === null && <ActivityIndicator />}
      {ok === true && <Text>{message}</Text>}
      {ok === false && (
        <Text style={{ color: 'red', padding: 16, textAlign: 'center' }}>
          Supabase connection failed: {message}
        </Text>
      )}
    </SafeAreaView>
  );
}
