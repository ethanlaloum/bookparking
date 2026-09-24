import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, type TextInput } from 'react-native';

import { isAcceptableEmail, isAcceptablePassword } from '@front/app/account/domain/entities/Account';
import { resetSignInState, signInRequested } from '@front/app/auth/domain/use-cases/sign-in/signInEpic';
import { selectSignInError, selectSignInLoading, selectSignInSuccess } from '@front/selectors/auth/authSelectors';

import { AuthSheet } from '../components/AuthSheet';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Notice } from '../components/ui/Notice';
import { Text } from '../components/ui/Text';
import { useAppDispatch, useAppSelector } from '../store/redux';

export default function SignInScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectSignInLoading);
  const error = useAppSelector(selectSignInError);
  const success = useAppSelector(selectSignInSuccess);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const passwordInput = useRef<TextInput>(null);

  useEffect(() => {
    if (success && router.canGoBack()) router.back();
  }, [success]);

  useEffect(() => () => void dispatch(resetSignInState()), [dispatch]);

  // Les mêmes prédicats que le schéma zod du site : ils vivent dans le domaine.
  const submit = (): void => {
    const next = {
      email: isAcceptableEmail(email.trim()) ? undefined : t('auth:validation.email'),
      password: isAcceptablePassword(password) ? undefined : t('auth:validation.password'),
    };
    setErrors(next);
    if (next.email === undefined && next.password === undefined)
      dispatch(signInRequested({ email: email.trim(), password }));
  };

  return (
    <AuthSheet
      title={t('auth:signIn.title')}
      subtitle={t('auth:signIn.subtitle')}
      footer={
        <Pressable accessibilityRole="link" onPress={() => router.replace('/inscription')}>
          <Text size={14} tone="muted">
            {t('auth:signIn.noAccount')}{' '}
            <Text size={14} weight="medium" tone="accent" style={{ textDecorationLine: 'underline' }}>
              {t('auth:signIn.createOne')}
            </Text>
          </Text>
        </Pressable>
      }
    >
      {error !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {error}
        </Notice>
      )}
      <Field
        label={t('auth:field.email')}
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <Field
        ref={passwordInput}
        label={t('auth:field.password')}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      <Button size="lg" block loading={loading} label={t('auth:signIn.submit')} onPress={submit} style={{ marginTop: 8 }} />
    </AuthSheet>
  );
}
