import { Text, View } from 'react-native';
import { AppContainer } from '../../src/components/AppContainer';

export default function FeedScreen() {
  return (
    <AppContainer>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
          Global Feed
        </Text>
        <Text>
          This will show recent posts from all users.
        </Text>
      </View>
    </AppContainer>
  );
}
