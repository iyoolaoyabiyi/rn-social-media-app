import { Text, View } from 'react-native';
import { AppContainer } from '../../src/components/AppContainer';

export default function CreatePostScreen() {
  return (
    <AppContainer>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
          Create a Post
        </Text>
        <Text>
          This will show a form for text and optional image.
        </Text>
      </View>
    </AppContainer>
  );
}
