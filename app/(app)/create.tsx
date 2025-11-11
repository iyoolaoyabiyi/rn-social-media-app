import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !profile) {
    return null;
  }

  async function pickImage() {
    setError(null);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });


    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function getImageArrayBuffer(uri: string) {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Unable to read image data.');
      }
      return await response.arrayBuffer();
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return decodeBase64(base64);
  }

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!imageUri) return null;

    try {
      // Infer extension from URI, fall back to jpg
      const uriLower = imageUri.toLowerCase();
      let fileExt: 'jpg' | 'jpeg' | 'png' = 'jpg';
      if (uriLower.endsWith('.png')) fileExt = 'png';
      if (uriLower.endsWith('.jpeg')) fileExt = 'jpeg';
      if (uriLower.endsWith('.jpg')) fileExt = 'jpg';

      const contentType =
        fileExt === 'png' ? 'image/png' : 'image/jpeg';

      const fileName = `${profile?.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;
      const filePath = fileName;

      const arrayBuffer = await getImageArrayBuffer(imageUri);

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.log('Upload error:', uploadError.message);
        setError('Failed to upload image.');
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('post-images').getPublicUrl(filePath);

      return publicUrl || null;
    } catch (err: any) {
      console.log('Upload exception:', err?.message || err);
      setError('Failed to process image.');
      return null;
    }
  }


  async function handleCreate() {
    setError(null);

    const trimmed = content.trim();
    if (!trimmed && !imageUri) {
      setError('Write something or choose an image.');
      return;
    }
    if (trimmed.length > 500) {
      setError('Post is too long (max 500 characters).');
      return;
    }

    setSubmitting(true);

    const imageUrl = await uploadImageIfNeeded();

    if (imageUri && !imageUrl) {
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from('posts').insert({
      user_id: profile?.id,
      content: trimmed || '',
      image_url: imageUrl,
    });

    setSubmitting(false);

    if (insertError) {
      console.log('Post insert error:', insertError.message);
      setError(insertError.message);
      return;
    }

    setContent('');
    setImageUri(null);
    router.replace('/(app)/feed');
  }

  function clearImage() {
    setImageUri(null);
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
            minHeight: 100,
            borderWidth: 1,
            borderColor: '#D1D5DB',
            borderRadius: 10,
            padding: 12,
            textAlignVertical: 'top',
          }}
        />

        {imageUri && (
          <View style={{ gap: 8 }}>
            <Image
              source={{ uri: imageUri }}
              style={{
                width: '100%',
                height: 200,
                borderRadius: 10,
                backgroundColor: '#F3F4F6',
              }}
              resizeMode="cover"
            />
            <Pressable
              onPress={clearImage}
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#D1D5DB',
              }}
            >
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                Remove image
              </Text>
            </Pressable>
          </View>
        )}

        {error && (
          <Text style={{ color: 'red', fontSize: 13 }}>
            {error}
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={pickImage}
            disabled={submitting}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#D1D5DB',
            }}
          >
            <Text style={{ fontSize: 14 }}>
              {imageUri ? 'Change image' : 'Add image'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCreate}
            disabled={submitting}
            style={{
              flex: 1,
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
              <Text
                style={{ color: '#FFFFFF', fontWeight: '500', fontSize: 14 }}
              >
                Post
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </AppContainer>
  );
}
