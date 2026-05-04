"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, updateProfileSchema } from "@/lib/validation";
import { api } from "@/lib/api";
import { DEFAULT_AVATAR_URL, isDefaultAvatarRef, resolveAvatarSrc } from "@/lib/avatar";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import type { z } from "zod";

type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function displaySettingsId(id: string): string {
  const short = id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `HT-${short}-XP`;
}

const inputClassName =
  "ht-dark-input w-full rounded-lg border-none bg-[#0e0e0e] p-4 text-[#e5e2e1] placeholder:text-[#ccc3d8]/30 outline-none transition-all focus:ring-1 focus:ring-[#d2bbff]";

/** Limit raw image size before Base64 (~1 MiB encoded in localStorage). */
const MAX_AVATAR_BYTES = 800 * 1024;

export default function SettingsProfilePage() {
  const { user, updateUser } = useAuth();
  const { setLanguage, language } = useLanguage();
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [uploadHint, setUploadHint] = useState<string | null>(null);

  const copy =
    language === "fr"
      ? {
          library: "Bibliotheque",
          profile: "Profil",
          logout: "Se deconnecter",
          settings: "Parametres",
          firstName: "Prenom",
          lastName: "Nom",
          username: "Nom d'utilisateur",
          emailAddress: "Adresse e-mail",
          bio: "Bio",
          bioPlaceholder: "Parlez aux autres de vous...",
          languagePreference: "Langue preferee",
          profileSaved: "Profil enregistre avec succes.",
          saveChanges: "Enregistrer",
          saving: "Enregistrement...",
          security: "Securite",
          securityHint: "Utilisez un mot de passe long et unique. Le changement vous garde connecte.",
          currentPassword: "Mot de passe actuel",
          newPassword: "Nouveau mot de passe",
          confirmNewPassword: "Confirmer le nouveau mot de passe",
          updatePassword: "Mettre a jour le mot de passe",
          updating: "Mise a jour...",
          passwordUpdated: "Mot de passe mis a jour avec succes.",
          uploadPhotoAria: "Telecharger une photo de profil",
          useDefaultAvatar: "Revenir a l'avatar Hypertube",
          avatarInvalidType: "Choisissez une image JPG, PNG, GIF ou WebP.",
          avatarTooLarge: "L'image doit peser au plus 800 Ko.",
          avatarSaveHint: "Enregistrez le profil pour conserver votre photo.",
        }
      : {
          library: "Library",
          profile: "Profile",
          logout: "Logout",
          settings: "Settings",
          firstName: "First Name",
          lastName: "Last Name",
          username: "Username",
          emailAddress: "Email Address",
          bio: "Bio",
          bioPlaceholder: "Tell others about you...",
          languagePreference: "Language Preference",
          profileSaved: "Profile saved successfully.",
          saveChanges: "Save Changes",
          saving: "Saving...",
          security: "Security",
          securityHint: "Use a long, unique password. Changing your password will keep you logged in.",
          currentPassword: "Current Password",
          newPassword: "New Password",
          confirmNewPassword: "Confirm New Password",
          updatePassword: "Update Password",
          updating: "Updating...",
          passwordUpdated: "Password updated successfully.",
          uploadPhotoAria: "Upload a profile photo",
          useDefaultAvatar: "Use Hypertube default avatar",
          avatarInvalidType: "Choose a JPG, PNG, GIF or WebP image.",
          avatarTooLarge: "Image must be no larger than about 800 KB.",
          avatarSaveHint: "Save your profile to keep your photo.",
        };

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      avatarUrl: DEFAULT_AVATAR_URL,
      bio: "",
      language: "en",
    },
  });

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    reset: resetPw,
    formState: { errors: errorsPw, isSubmitting: isPasswordSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (!user) {
      return;
    }
    reset({
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: resolveAvatarSrc(user.avatarUrl),
      bio: user.bio || "",
      language: user.language,
    });
  }, [reset, user]);

  const watchedAvatar = useWatch({
    control,
    name: "avatarUrl",
    defaultValue: DEFAULT_AVATAR_URL,
  });
  const avatarPreview = resolveAvatarSrc(watchedAvatar);
  const showRevertToDefault = !isDefaultAvatarRef(watchedAvatar);

  const onAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      return;
    }

    const okMime = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type);
    const fallbackByName = file.type === "" && /\.(jpe?g|png|gif|webp)$/i.test(file.name);
    if (!okMime && !fallbackByName) {
      setUploadHint(copy.avatarInvalidType);
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setUploadHint(copy.avatarTooLarge);
      return;
    }

    setUploadHint(null);
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      if (typeof data === "string") {
        setValue("avatarUrl", data, { shouldDirty: true, shouldValidate: true });
        setUploadHint(copy.avatarSaveHint);
      }
    };
    reader.onerror = () => {
      setUploadHint(copy.avatarInvalidType);
    };
    reader.readAsDataURL(file);
  };

  const onProfileSubmit = async (values: UpdateProfileValues) => {
    if (!user) {
      return;
    }
    setProfileStatus(null);
    setUploadHint(null);
    await updateUser({
      email: values.email,
      username: values.username,
      firstName: values.firstName,
      lastName: values.lastName,
      avatarUrl: values.avatarUrl,
      bio: values.bio || "",
      language: values.language,
    });
    setLanguage(values.language);
    setProfileStatus(values.language === "fr" ? "Profil enregistre avec succes." : "Profile saved successfully.");
  };

  const onPasswordSubmit = async (values: ChangePasswordValues) => {
    setPasswordError(null);
    setPasswordStatus(null);
    try {
      await api.changePassword(values.currentPassword, values.newPassword);
      resetPw();
      setPasswordStatus(copy.passwordUpdated);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not update password.";
      setPasswordError(message);
    }
  };

  return (
    <ProtectedPage>
      {user ? (
        <div className="flex min-h-screen flex-col bg-[#131313] text-[#e5e2e1]">
          <nav className="fixed top-0 z-50 w-full bg-[#131313]/60 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-8 py-4">
              <div className="flex items-center gap-12">
                <Link href="/" className="text-2xl font-black uppercase tracking-tighter text-[#d2bbff]">
                  HYPERTUBE
                </Link>
                <div className="hidden gap-8 md:flex">
                  <Link
                    className="text-sm font-medium tracking-tight text-gray-400 transition-colors hover:text-white"
                    href="/library"
                  >
                    {copy.library}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href={`/profile/${user.username}`}
                  className="group flex cursor-pointer items-center gap-4"
                >
                  <Image
                    alt=""
                    className="h-8 w-8 rounded-full border-2 border-transparent object-cover transition-all group-hover:border-[#d2bbff]"
                    height={32}
                    src={avatarPreview}
                    unoptimized
                    width={32}
                  />
                  <span className="border-b-2 border-[#7c3aed] pb-1 text-sm font-bold tracking-tight text-[#d2bbff]">
                    {copy.profile}
                  </span>
                </Link>
                <Link className="text-sm font-medium text-gray-400 transition-colors hover:text-white" href="/logout">
                  {copy.logout}
                </Link>
              </div>
            </div>
          </nav>

          <main className="w-full max-w-5xl flex-1 self-center px-8 pb-24 pt-32">
            <div className="mb-16 flex flex-col items-baseline justify-between gap-4 md:flex-row">
              <h1 className="text-5xl font-black uppercase tracking-tighter text-[#e5e2e1] sm:text-6xl">{copy.settings}</h1>
              <p className="text-sm font-medium uppercase tracking-widest text-[#ccc3d8]">ID: {displaySettingsId(user.id)}</p>
            </div>

            <div className="space-y-16">
              <form className="space-y-16" onSubmit={handleSubmit(onProfileSubmit)}>
                <section className="grid grid-cols-1 items-start gap-12 md:grid-cols-12">
                  <div className="flex flex-col items-center gap-4 md:col-span-4 md:items-start">
                    <input
                      id="settings-profile-avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                      className="sr-only"
                      aria-label={copy.uploadPhotoAria}
                      onChange={onAvatarFileChange}
                    />
                    <input type="hidden" {...register("avatarUrl")} />
                    <label
                      htmlFor="settings-profile-avatar-upload"
                      className="group relative h-48 w-48 shrink-0 cursor-pointer overflow-hidden rounded-full bg-[#ede8f7] ring-2 ring-[#d2bbff]/30 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#d2bbff]"
                    >
                      <Image
                        alt=""
                        className="h-full w-full object-cover"
                        fill
                        sizes="192px"
                        src={avatarPreview}
                        unoptimized
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="material-symbols-outlined text-3xl text-white" aria-hidden>
                          photo_camera
                        </span>
                      </span>
                    </label>
                    {showRevertToDefault ? (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadHint(null);
                          setValue("avatarUrl", DEFAULT_AVATAR_URL, { shouldDirty: true, shouldValidate: true });
                        }}
                        className="text-center text-xs font-medium text-[#ccc3d8] underline underline-offset-2 transition-colors hover:text-[#e5e2e1] md:text-left"
                      >
                        {copy.useDefaultAvatar}
                      </button>
                    ) : null}
                    {uploadHint ? (
                      <p className="w-full max-w-xs text-center text-xs text-[#a78bfa] md:text-left">{uploadHint}</p>
                    ) : null}
                    {errors.avatarUrl ? (
                      <p className="w-full max-w-xs text-center text-xs text-[#ffb4ab] md:text-left">{errors.avatarUrl.message}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:col-span-8">
                    <div className="flex flex-col gap-2">
                      <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">{copy.firstName}</label>
                      <input className={inputClassName} type="text" {...register("firstName")} />
                      {errors.firstName ? <p className="text-xs text-[#ffb4ab]">{errors.firstName.message}</p> : null}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">{copy.lastName}</label>
                      <input className={inputClassName} type="text" {...register("lastName")} />
                      {errors.lastName ? <p className="text-xs text-[#ffb4ab]">{errors.lastName.message}</p> : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">{copy.username}</label>
                      <input className={inputClassName} type="text" autoComplete="username" {...register("username")} />
                      {errors.username ? <p className="text-xs text-[#ffb4ab]">{errors.username.message}</p> : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">{copy.emailAddress}</label>
                      <input className={inputClassName} type="email" autoComplete="email" {...register("email")} />
                      {errors.email ? <p className="text-xs text-[#ffb4ab]">{errors.email.message}</p> : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">{copy.bio}</label>
                      <textarea
                        className={`${inputClassName} min-h-[88px] resize-y`}
                        rows={3}
                        placeholder={copy.bioPlaceholder}
                        {...register("bio")}
                      />
                      {errors.bio ? <p className="text-xs text-[#ffb4ab]">{errors.bio.message}</p> : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">{copy.languagePreference}</label>
                      <div className="relative">
                        <select
                          className={`${inputClassName} w-full cursor-pointer appearance-none pr-10`}
                          {...register("language")}
                        >
                          <option value="en">English (US)</option>
                          <option value="fr">Français</option>
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#ccc3d8]">
                          <span className="material-symbols-outlined">expand_more</span>
                        </span>
                      </div>
                      {errors.language ? <p className="text-xs text-[#ffb4ab]">{errors.language.message}</p> : null}
                    </div>
                    {profileStatus ? <p className="text-sm text-[#6ee7b7] sm:col-span-2">{profileStatus}</p> : null}
                    <div className="flex justify-end sm:col-span-2 sm:pt-4">
                      <button
                        className="rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-12 py-4 text-sm font-bold text-[#ede0ff] shadow-lg shadow-black/20 transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? copy.saving : copy.saveChanges}
                      </button>
                    </div>
                  </div>
                </section>
              </form>

              <div className="h-px w-full bg-[#2a2a2a]/30" />

              <section className="grid grid-cols-1 items-start gap-12 md:grid-cols-12">
                <div className="md:col-span-4">
                  <h2 className="text-2xl font-bold tracking-tight text-[#e5e2e1]">{copy.security}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#ccc3d8]">
                    {copy.securityHint}
                  </p>
                </div>
                <form
                  className="flex flex-col gap-6 md:col-span-8"
                  onSubmit={handleSubmitPw(onPasswordSubmit)}
                >
                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">
                      {copy.currentPassword}
                    </label>
                    <input
                      className={inputClassName}
                      type="password"
                      autoComplete="current-password"
                      {...registerPw("currentPassword")}
                    />
                    {errorsPw.currentPassword ? (
                      <p className="text-xs text-[#ffb4ab]">{errorsPw.currentPassword.message}</p>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">
                        {copy.newPassword}
                      </label>
                      <input
                        className={inputClassName}
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...registerPw("newPassword")}
                      />
                      {errorsPw.newPassword ? (
                        <p className="text-xs text-[#ffb4ab]">{errorsPw.newPassword.message}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="px-1 text-xs font-bold uppercase tracking-widest text-[#ccc3d8]">
                        {copy.confirmNewPassword}
                      </label>
                      <input
                        className={inputClassName}
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...registerPw("confirmNewPassword")}
                      />
                      {errorsPw.confirmNewPassword ? (
                        <p className="text-xs text-[#ffb4ab]">{errorsPw.confirmNewPassword.message}</p>
                      ) : null}
                    </div>
                  </div>
                  {passwordError ? <p className="text-sm text-[#ffb4ab]">{passwordError}</p> : null}
                  {passwordStatus ? <p className="text-sm text-[#6ee7b7]">{passwordStatus}</p> : null}
                  <div className="flex justify-end pt-4">
                    <button
                      className="rounded-lg bg-[#2a2a2a] px-12 py-4 text-sm font-bold text-[#ccc3d8] transition-all hover:text-[#e5e2e1] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isPasswordSubmitting}
                      type="submit"
                    >
                      {isPasswordSubmitting ? copy.updating : copy.updatePassword}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </main>

          <footer className="mt-auto w-full bg-[#0e0e0e] py-12 transition-opacity">
            <div className="mx-auto flex w-full max-w-screen-2xl flex-col items-center justify-between gap-6 px-12 opacity-40 transition-opacity hover:opacity-100 md:flex-row">
              <span className="text-xs font-medium uppercase tracking-widest text-[#7c3aed]">
                © 2026 Hypertube. The Cinematic Void.
              </span>
              <div className="flex gap-8">
                <a
                  className="text-xs uppercase tracking-widest text-gray-600 transition-colors hover:text-[#d2bbff]"
                  href="#"
                >
                  Privacy
                </a>
                <a
                  className="text-xs uppercase tracking-widest text-gray-600 transition-colors hover:text-[#d2bbff]"
                  href="#"
                >
                  Terms
                </a>
                <a
                  className="text-xs uppercase tracking-widest text-gray-600 transition-colors hover:text-[#d2bbff]"
                  href="#"
                >
                  Support
                </a>
              </div>
            </div>
          </footer>
        </div>
      ) : null}
    </ProtectedPage>
  );
}
