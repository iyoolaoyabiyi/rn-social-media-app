import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppContainer } from '../../../src/components/AppContainer';
import { useAuth } from '../../../src/context/AuthContext';
import { supabase } from '../../../src/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, session, setProfileReloadTrigger } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const avatarUri = profile?.avatar_url ?? null;
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !profile) {
    return null;
  }

  async function pickAvatar() {
    setError(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access gallery is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setNewAvatarUri(result.assets[0].uri);
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

  function deriveAvatarPathFromUrl(url: string | null): string | null {
    if (!url) return null;
    // Typical public URL:
    // https://<proj>.supabase.co/storage/v1/object/public/avatars/<userId>/avatar-123.jpg
    const m = url.match(/\/storage\/v1\/object\/public\/avatars\/(.+?)(\?|$)/);
    return m?.[1] ? m[1] : null;
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!newAvatarUri) return avatarUri;

    try {
      const uriLower = newAvatarUri.toLowerCase();
      let fileExt = 'jpg';
      if (uriLower.endsWith('.png')) fileExt = 'png';
      if (uriLower.endsWith('.jpeg')) fileExt = 'jpeg';

      const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `${profile?.id}/avatar-${Date.now()}.${fileExt}`;

      const arrayBuffer = await getImageArrayBuffer(newAvatarUri);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.log('Avatar upload error:', uploadError.message);
        setError('Failed to upload avatar.');
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      return publicUrl || null;
    } catch (err: any) {
      console.log('Avatar upload exception:', err?.message || err);
      setError('Failed to process avatar image.');
      return null;
    }
  }

  async function handleSave() {
    setError(null);
    setSubmitting(true);

    const avatarUrl = await uploadAvatar();

    if (newAvatarUri && !avatarUrl) {
      setSubmitting(false);
      return;
    }

    const updates = {
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile?.id);

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setProfileReloadTrigger((prev) => prev + 1);
    router.replace('/(tabs)/profile');
  }

  const confirmDelete = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return window.confirm('Remove your avatar? This cannot be undone.');
    }
    return new Promise((resolve) => {
      Alert.alert(
        'Remove Avatar',
        'Remove your avatar? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });
  };

  async function handleDeleteAvatar() {
    if (submitting) return;
    if (!avatarUri && !newAvatarUri) return;

    const ok = await confirmDelete();
    if (!ok) return;

    try {
      setSubmitting(true);
      setError(null);

      // Attempt to remove from storage only if we have an existing stored URL
      const path = deriveAvatarPathFromUrl(avatarUri);
      if (path) {
        const { error: removeErr } = await supabase.storage
          .from('avatars')
          .remove([path]);
        if (removeErr) {
          // Not fatal; log and continue to null out profile
          console.log('Avatar storage remove error:', removeErr.message);
        }
      }

      // Null avatar in profile
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id);

      if (updateErr) {
        setError(updateErr.message);
        return;
      }

      // Clear local state (also discard any newly picked but unsaved avatar)
      setNewAvatarUri(null);
      setProfileReloadTrigger((prev) => prev + 1);
    } catch (err: any) {
      console.log('Delete avatar exception:', err?.message || err);
      setError('Failed to remove avatar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppContainer>
      <View style={{ padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '600' }}>Edit Profile</Text>

        <Pressable onPress={pickAvatar} disabled={submitting}>
          {newAvatarUri ? (
            <Image
              source={{ uri: newAvatarUri }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#E5E7EB',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#6B7280' }}>Add Avatar</Text>
            </View>
          )}
        </Pressable>

        {(avatarUri || newAvatarUri) && (
          <Pressable
            onPress={handleDeleteAvatar}
            disabled={submitting}
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#EF4444',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Text style={{ color: '#EF4444', fontWeight: '500' }}>
              Remove avatar
            </Text>
          </Pressable>
        )}

        <TextInput
          placeholder="Display Name (optional)"
          value={displayName}
          onChangeText={setDisplayName}
          style={{
            borderWidth: 1,
            borderColor: '#D1D5DB',
            padding: 12,
            borderRadius: 8,
          }}
        />

        {error && <Text style={{ color: 'red', fontSize: 14 }}>{error}</Text>}

        <Pressable
          onPress={handleSave}
          disabled={submitting}
          style={{
            backgroundColor: '#111827',
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            opacity: submitting ? 0.8 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '500' }}>Save</Text>
          )}
        </Pressable>
      </View>
    </AppContainer>
  );
}
