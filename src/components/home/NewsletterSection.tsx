"use client";

import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!validEmail) {
      setMessage("Enter a valid email address to continue.");
      return;
    }

    setMessage(
      "Your email format is valid. Newsletter signup is not connected yet.",
    );
  }

  return (
    <section className="newsletter-section" aria-labelledby="newsletter-title">
      <Container className="newsletter-section__inner">
        <div>
          <p className="eyebrow">A considered correspondence</p>
          <h2 id="newsletter-title">Letters from MALYK</h2>
          <p>
            Discover new collections, editorial stories, and updates from the
            world of MALYK.
          </p>
        </div>
        <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="newsletter-email">Email address</label>
          <div className="newsletter-form__row">
            <input
              autoComplete="email"
              id="newsletter-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage("");
              }}
              placeholder="Your email address"
              required
              aria-describedby="newsletter-note newsletter-feedback"
            />
            <button className="button button--primary" type="submit">
              Continue
            </button>
          </div>
          <p id="newsletter-note" className="newsletter-form__note">
            This preview does not subscribe or store your email.
          </p>
          <p
            className="newsletter-form__feedback"
            id="newsletter-feedback"
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        </form>
      </Container>
    </section>
  );
}
