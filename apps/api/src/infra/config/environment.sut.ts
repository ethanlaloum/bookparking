import { EmailSending, environment } from './environment';

const EMAIL_VARIABLES = [
  'EMAIL_SENDING',
  'RESEND_API_KEY',
  'MAIL_FROM',
] as const;

type EmailVariable = (typeof EMAIL_VARIABLES)[number];

interface Outcome {
  settings?: EmailSending;
  error?: Error;
}

export const createEnvironmentSUT = () => {
  const saved = EMAIL_VARIABLES.map(
    (name) => [name, process.env[name]] as const,
  );

  return {
    givenVariables(variables: Partial<Record<EmailVariable, string>>) {
      for (const name of EMAIL_VARIABLES) delete process.env[name];
      Object.assign(process.env, variables);
    },

    whenReadingEmailSending(): Outcome {
      try {
        return { settings: environment.emailSending() };
      } catch (error: unknown) {
        return { error: error as Error };
      }
    },

    thenStartIsRefusedNaming(outcome: Outcome, variable: string) {
      expect(outcome.settings).toBeUndefined();
      expect(outcome.error?.message).toContain(variable);
    },

    thenSendingIsDisabled(outcome: Outcome) {
      expect(outcome).toEqual({ settings: 'disabled' });
    },

    thenSendingUses(outcome: Outcome, settings: EmailSending) {
      expect(outcome).toEqual({ settings });
    },

    tearDown() {
      for (const [name, value] of saved) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    },
  };
};
