"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  deleteAccountAction,
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initialState: AuthActionState = {};

export function AccountProfileForm({
  initialDisplayName,
  initialPhone = "",
  initialAvatarUrl = null,
}: {
  initialDisplayName: string;
  initialPhone?: string;
  initialAvatarUrl?: string | null;
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, initialState);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatarAction, initialState);

  return (
    <>
      <section className="account-avatar-section" aria-labelledby="avatar-heading">
        <h2 id="avatar-heading">Profile picture</h2>
        {initialAvatarUrl ? (
          <Image className="account-avatar" src={initialAvatarUrl} alt="Your profile" width={80} height={80} unoptimized />
        ) : null}
        <form className="account-form" action={avatarAction}>
          <label>
            <span>Choose an image</span>
            <input accept="image/jpeg,image/png,image/webp" name="avatar" required type="file" />
          </label>
          {avatarState.error ? <p className="form-message form-message--error" role="alert">{avatarState.error}</p> : null}
          {avatarState.success ? <p className="form-message" role="status">{avatarState.success}</p> : null}
          <button className="button button--secondary" disabled={avatarPending} type="submit">
            {avatarPending ? "Uploading…" : "Upload avatar"}
          </button>
        </form>
        {initialAvatarUrl ? (
          <form action={removeAvatarAction}>
            <button className="button button--text" type="submit">Remove avatar</button>
          </form>
        ) : null}
      </section>

      <form className="account-form" action={profileAction}>
        <label>
          <span>Name</span>
          <input autoComplete="name" defaultValue={initialDisplayName} maxLength={100} name="displayName" required />
        </label>
        <label>
          <span>Phone number</span>
          <input autoComplete="tel" defaultValue={initialPhone} maxLength={40} name="phone" />
        </label>
        {profileState.error ? <p className="form-message form-message--error" role="alert">{profileState.error}</p> : null}
                {profileState.success ? <p className="form-message" role="status">{profileState.success}</p> : null}
        <button className="button button--primary" disabled={profilePending} type="submit">
          {profilePending ? "Saving…" : "Save profile"}
        </button>
      </form>

      <section className="account-danger" aria-labelledby="delete-account-heading">
        <h2 id="delete-account-heading">Delete account</h2>
        <p>This permanently removes your MALYK account and profile.</p>
        <form action={deleteAccountAction}>
          <button
            className="button button--danger"
            type="submit"
            onClick={(event) => {
              if (!window.confirm("Permanently delete your account? This cannot be undone.")) event.preventDefault();
            }}
          >Delete my account</button>
        </form>
      </section>
    </>
  );
}
