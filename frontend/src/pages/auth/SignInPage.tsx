import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useDemoSession } from '@/app/demo/demoSessionContext';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Card } from '@/shared/ui/Card/Card';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';
import { Field } from '@/shared/ui/Field/Field';

import styles from './auth.module.css';

const SignInPage = () => {
  const { setRole } = useDemoSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [attempted, setAttempted] = useState(false);

  /** Demonstrates validation states only. No credential ever leaves this page. */
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: { email?: string; password?: string } = {};

    if (!email.includes('@')) next.email = 'Enter an email address in the form name@example.com.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';

    setErrors(next);
    setAttempted(Object.keys(next).length === 0);
  };

  const enterAs = (role: 'tenant' | 'landlord') => {
    setRole(role);
    navigate(role === 'tenant' ? routes.tenant.overview : routes.landlord.overview);
  };

  return (
    <div className={styles.page}>
      <Card title="Prototype sign-in" description="RentDito does not have real accounts yet.">
        <InlineAlert tone="info" title="No real accounts yet">
          This screen shows how sign-in would look and behave. Nothing you type is sent, checked,
          or stored — use a demo role below to explore the workspaces.
        </InlineAlert>

        <form className={styles.form} onSubmit={submit} noValidate>
          <Field label="Email address" required error={errors.email}>
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field
            label="Password"
            required
            hint="Never submitted anywhere. This field only demonstrates validation."
            error={errors.password}
          >
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {attempted ? (
            <InlineAlert tone="warning" title="There is no account to sign in to">
              The form passed validation, but this prototype has no authentication. Continue with a
              demo role instead.
            </InlineAlert>
          ) : null}

          <Button type="submit" block>
            Check this form
          </Button>
        </form>
      </Card>

      <Card title="Explore without an account">
        <p className={styles.helpText}>
          Pick a role to see the prototype from that person&apos;s point of view. You can switch at
          any time from the header.
        </p>
        <div className={styles.demoActions}>
          <Button size="large" block onClick={() => enterAs('tenant')}>
            Continue as tenant demo
          </Button>
          <Button size="large" variant="secondary" block onClick={() => enterAs('landlord')}>
            Continue as landlord demo
          </Button>
        </div>
        <p className={styles.helpText}>
          New here? <Link to={routes.register}>See the registration screen</Link>.
        </p>
      </Card>
    </div>
  );
};

export default SignInPage;
