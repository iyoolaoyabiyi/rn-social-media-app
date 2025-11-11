import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppContainer } from '../../src/components/AppContainer';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

export default function CreatePostScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();

  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !profile) {
    // Parent layout should guard, but safety first.
    return null;
  }

  async function handleCreate() {
    setError(null);
    const trimmed = content.trim();

    if (!trimmed) {
      setError('Say something first.');
      return;
    }

    // Example soft limit
    if (trimmed.length > 500) {
      setError('Post is too long (max 500 characters).');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('posts').insert({
      user_id: profile?.id, // Must match auth.uid() due to RLS
      content: trimmed,
      image_url: null,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setContent('');
    // Go back to feed to see it
    router.replace('/(app)/feed');
  }

  return (
    <AppContainer>
      <View style={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>
          Create a Post
        </Text>
        <TextInput
          placeholder="Share something..."
          value={content}
          onChangeText={setContent}
          multiline
          style={{
            minHeight: 120,
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 10,
            padding: 12,
            textAlignVertical: 'top',
          }}
        />
        {error && (
          <Text style={{ color: 'red', fontSize: 13 }}>
            {error}
          </Text>
        )}
        <Pressable
          onPress={handleCreate}
          disabled={submitting}
          style={{
            backgroundColor: '#111827',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            opacity: submitting ? 0.8 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>
              Post
            </Text>
          )}
        </Pressable>
      </View>
    </AppContainer>
  );
}
