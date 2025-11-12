import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { theme } from '../theme';

type Props = {
  children: ReactNode;
};

export function AppContainer({ children }: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.palette.background,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    flexGrow: 1,
    alignItems: 'center',
  },
  inner: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
});
