import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Card } from '@/shared/ui/Card/Card';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';
import { Field } from '@/shared/ui/Field/Field';

import styles from './auth.module.css';

interface RegisterErrors {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

const RegisterPage = () => {
  const [values, setValues] = useState({ name: '', email: '', phone: '', role: '' });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [passed, setPassed] = useState(false);

  const update = (key: keyof typeof values) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  /** Presentational only: the prototype creates no account and stores nothing. */
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: RegisterErrors = {};

    if (values.name.trim().length < 2) next.name = 'Enter your full name.';
    if (!values.email.includes('@')) next.email = 'Enter an email address in the form name@example.com.';
    if (!/^0\d{2}\s?\d{3}\s?\d{4}$/.test(values.phone.trim()))
      next.phone = 'Enter a Philippine mobile number, for example 0917 555 0184.';
    if (!values.role) next.role = 'Tell us how you plan to use RentDito.';

    setErrors(next);
    setPassed(Object.keys(next).length === 0);
  };

  return (
    <div className={styles.page}>
      <Card
        title="Create a prototype account"
        description="Shown to demonstrate the registration screen and its validation."
      >
        <InlineAlert tone="info" title="Nothing is submitted or saved">
          RentDito has no backend in this prototype. Your details stay in this browser tab and are
          discarded when you leave the page.
        </InlineAlert>

        <form className={styles.form} onSubmit={submit} noValidate>
          <Field label="Full name" required error={errors.name}>
            <input
              type="text"
              autoComplete="off"
              value={values.name}
              onChange={(event) => update('name')(event.target.value)}
            />
          </Field>

          <Field label="Email address" required error={errors.email}>
            <input
              type="email"
              autoComplete="off"
              value={values.email}
              onChange={(event) => update('email')(event.target.value)}
            />
          </Field>

          <Field
            label="Mobile number"
            required
            hint="Philippine format, for example 0917 555 0184."
            error={errors.phone}
          >
            <input
              type="tel"
              autoComplete="off"
              value={values.phone}
              onChange={(event) => update('phone')(event.target.value)}
            />
          </Field>

          <Field label="How will you use RentDito?" required error={errors.role}>
            <select value={values.role} onChange={(event) => update('role')(event.target.value)}>
              <option value="">Choose one</option>
              <option value="tenant">I am looking for a place to rent</option>
              <option value="landlord">I manage properties to rent out</option>
            </select>
          </Field>

          {passed ? (
            <InlineAlert tone="success" title="This form is valid">
              In a live version your account would be created now. In the prototype, continue with a
              demo role instead.
            </InlineAlert>
          ) : null}

          <Button type="submit" block>
            Check this form
          </Button>
        </form>

        <p className={styles.helpText}>
          Already exploring? <Link to={routes.signIn}>Go to prototype sign-in</Link>.
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
