import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Trans, useTranslation } from 'react-i18next';
import { Pressable, View, type TextInput } from 'react-native';

import { isAcceptableEmail } from '@front/app/account/domain/entities/Account';
import { passwordStrengthOf, passwordsMatch } from '@front/app/account/domain/entities/Password';
import { humanProofRequested } from '@front/app/account/domain/use-cases/human-proof/humanProofEpic';
import {
  registerAccountRequested,
  resetRegisterAccountState,
} from '@front/app/account/domain/use-cases/register-account/registerAccountEpic';
import {
  selectHumanProof,
  selectHumanProofFailed,
  selectRegisterError,
  selectRegisterLoading,
} from '@front/selectors/account/accountSelectors';
import { selectIsAuthenticated, selectSignInLoading } from '@front/selectors/auth/authSelectors';

import { AuthSheet } from '../components/AuthSheet';
import { HumanCheck } from '../components/HumanCheck';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { resolveFrontBaseUrl } from '../lib/apiBaseUrl';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Notice } from '../components/ui/Notice';
import { Text } from '../components/ui/Text';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { useTheme } from '../theme/useTheme';

/**
 * L'inscription enchaîne sur une connexion (c'est l'epic du site qui le fait) :
 * la feuille se referme dès que le compte est connecté.
 */
export default function RegisterScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectRegisterLoading);
  const signingIn = useAppSelector(selectSignInLoading);
  const error = useAppSelector(selectRegisterError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const humanProof = useAppSelector(selectHumanProof);
  const humanProofFailed = useAppSelector(selectHumanProofFailed);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmation?: string;
    terms?: string;
  }>({});
  const passwordInput = useRef<TextInput>(null);
  const confirmationInput = useRef<TextInput>(null);

  // SPEC-007 : la preuve anti-robot se calcule dès l'ouverture de la feuille.
  useEffect(() => {
    dispatch(humanProofRequested());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && router.canGoBack()) router.back();
  }, [isAuthenticated]);

  useEffect(() => () => void dispatch(resetRegisterAccountState()), [dispatch]);

  const submit = (): void => {
    const strength = passwordStrengthOf(password);
    const next = {
      email: isAcceptableEmail(email.trim()) ? undefined : t('auth:validation.email'),
      password:
        strength === 'TOO_SHORT'
          ? t('auth:validation.password')
          : strength === 'WEAK'
            ? t('auth:validation.passwordWeak')
            : undefined,
      confirmation: passwordsMatch(password, confirmation)
        ? undefined
        : t('auth:validation.passwordMismatch'),
      terms: acceptsTerms ? undefined : t('auth:validation.terms'),
    };
    setErrors(next);
    if (
      humanProof !== null &&
      next.email === undefined &&
      next.password === undefined &&
      next.confirmation === undefined &&
      next.terms === undefined
    )
      dispatch(registerAccountRequested({ email: email.trim(), password, humanProof, acceptsTerms }));
  };

  return (
    <AuthSheet
      title={t('auth:register.title')}
      subtitle={t('auth:register.subtitle')}
      footer={
        <Pressable accessibilityRole="link" onPress={() => router.replace('/connexion')}>
          <Text size={14} tone="muted">
            {t('auth:register.hasAccount')}{' '}
            <Text size={14} weight="medium" tone="accent" style={{ textDecorationLine: 'underline' }}>
              {t('auth:register.signIn')}
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
        hint={t('auth:field.passwordHint')}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmationInput.current?.focus()}
      />
      <PasswordStrengthMeter password={password} />
      <Field
        ref={confirmationInput}
        label={t('auth:field.confirmPassword')}
        value={confirmation}
        onChangeText={setConfirmation}
        error={errors.confirmation}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {/* Les conditions et la politique de données font foi en français, sur le
          site : l'app les ouvre plutôt que d'en garder une copie qui divergerait. */}
      <TermsCheckbox checked={acceptsTerms} onToggle={() => setAcceptsTerms((value) => !value)} error={errors.terms} />
      <HumanCheck ready={humanProof !== null} failed={humanProofFailed} />
      <Trans
        i18nKey="auth:register.privacy"
        parent={LegalParagraph}
        components={{ privacy: <LegalLink path="/donnees-personnelles" /> }}
      />
      <Button
        size="lg"
        block
        loading={loading || signingIn}
        disabled={humanProof === null}
        label={t('auth:register.submit')}
        onPress={submit}
        style={{ marginTop: 8 }}
      />
    </AuthSheet>
  );
}

// SPEC-008 : la case des conditions d'utilisation. Le lien s'ouvre sans cocher :
// seul un appui hors du lien bascule la case.
const TermsCheckbox = ({
  checked,
  onToggle,
  error,
}: {
  checked: boolean;
  onToggle: () => void;
  error: string | undefined;
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            marginTop: 1,
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: error === undefined ? (checked ? colors.brand : colors.lineStrong) : colors.danger,
            backgroundColor: checked ? colors.brand : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked && (
            <Text size={13} weight="bold" tone="onBrand">
              ✓
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Trans
            i18nKey="auth:register.acceptTerms"
            parent={TermsParagraph}
            components={{ terms: <LegalLink path="/conditions-d-utilisation" size={14} /> }}
          />
        </View>
      </Pressable>
      {error !== undefined && (
        <Text size={12} weight="medium" tone="danger">
          {error}
        </Text>
      )}
    </View>
  );
};

const TermsParagraph = ({ children }: { children?: ReactNode }) => (
  <Text size={14} style={{ lineHeight: 20 }}>
    {children}
  </Text>
);

const LegalParagraph = ({ children }: { children?: ReactNode }) => (
  <Text size={13} tone="muted" style={{ lineHeight: 20 }}>
    {children}
  </Text>
);

const LegalLink = ({
  path,
  size = 13,
  children,
}: {
  path: string;
  size?: number;
  children?: ReactNode;
}) => (
  <Text
    size={size}
    weight="medium"
    tone="accent"
    accessibilityRole="link"
    style={{ textDecorationLine: 'underline' }}
    onPress={() => void WebBrowser.openBrowserAsync(`${resolveFrontBaseUrl()}${path}`)}
  >
    {children}
  </Text>
);
