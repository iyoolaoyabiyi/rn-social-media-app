import { ReactNode } from 'react';
import { Text, TextProps } from 'react-native';
import { theme } from '../theme';

type TypographyProps = TextProps & { children: ReactNode };

export function Heading({ style, children, ...rest }: TypographyProps) {
  return (
    <Text
      style={[theme.typography.heading, { letterSpacing: 0.2 }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function Body({ style, children, ...rest }: TypographyProps) {
  return (
    <Text style={[theme.typography.body, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Caption({ style, children, ...rest }: TypographyProps) {
  return (
    <Text style={[theme.typography.caption, style]} {...rest}>
      {children}
    </Text>
  );
}
