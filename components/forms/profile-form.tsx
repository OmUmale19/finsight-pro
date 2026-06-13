"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, ShieldCheck, SlidersHorizontal, UserRoundPen } from "lucide-react";

import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormProps = {
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
    jobTitle?: string | null;
    company?: string | null;
    location?: string | null;
    bio?: string | null;
    emailNotifications?: boolean;
    weeklyDigest?: boolean;
    productUpdates?: boolean;
    createdAt: string | Date;
  };
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read the selected image"));
    reader.readAsDataURL(file);
  });
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [preferencesSuccess, setPreferencesSuccess] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [name, setName] = useState(user.name);
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [company, setCompany] = useState(user.company ?? "");
  const [location, setLocation] = useState(user.location ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [email, setEmail] = useState(user.email);
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(user.weeklyDigest ?? true);
  const [productUpdates, setProductUpdates] = useState(user.productUpdates ?? false);

  const joinedOn = useMemo(
    () =>
      new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
    [user.createdAt]
  );

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      name,
      avatarUrl,
      jobTitle,
      company,
      location,
      bio
    };

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setError(result.error ?? "Unable to update profile");
      setProfileLoading(false);
      return;
    }

    setSuccess("Profile updated successfully.");
    setProfileLoading(false);
    router.refresh();
  }

  async function handlePreferencesSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreferencesLoading(true);
    setPreferencesError("");
    setPreferencesSuccess("");

    const response = await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        emailNotifications,
        weeklyDigest,
        productUpdates
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setPreferencesError(result.error ?? "Unable to update preferences");
      setPreferencesLoading(false);
      return;
    }

    setPreferencesSuccess("Preferences updated successfully.");
    setPreferencesLoading(false);
    router.refresh();
  }

  async function handleSecuritySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecurityLoading(true);
    setSecurityError("");
    setSecuritySuccess("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email,
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? "")
    };

    const response = await fetch("/api/profile/security", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setSecurityError(result.error ?? "Unable to update security settings");
      setSecurityLoading(false);
      return;
    }

    setSecuritySuccess(result.data.passwordChanged ? "Email and password updated successfully." : "Email updated successfully.");
    setSecurityLoading(false);
    router.refresh();
    event.currentTarget.reset();
  }

  async function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Please select an image smaller than 2 MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatarUrl(dataUrl);
      setError("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to load image.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-border bg-card/85 shadow-soft backdrop-blur">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Profile preview</CardTitle>
          <CardDescription>This is how your workspace identity appears across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <ProfileAvatar name={name} avatarUrl={avatarUrl || undefined} className="h-20 w-20 rounded-3xl object-cover" />
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">{name}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
              {jobTitle || company ? (
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {[jobTitle, company].filter(Boolean).join(" at ")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-muted/40 p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account</p>
            <div className="mt-3 space-y-2">
              <p>
                <span className="text-muted-foreground">Email:</span> {user.email}
              </p>
              <p>
                <span className="text-muted-foreground">Joined:</span> {joinedOn}
              </p>
              <p>
                <span className="text-muted-foreground">Location:</span> {location || "Add your location"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
            Add a clean photo, role, and company details to make your workspace feel more polished and professional.
          </div>

          <div className="rounded-3xl border border-border/60 bg-muted/40 p-4 text-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Preferences snapshot</p>
            <div className="mt-3 space-y-2">
              <p>{emailNotifications ? "Email alerts enabled" : "Email alerts disabled"}</p>
              <p>{weeklyDigest ? "Weekly digest enabled" : "Weekly digest disabled"}</p>
              <p>{productUpdates ? "Product updates enabled" : "Product updates disabled"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border bg-card/85 shadow-soft backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-2xl">
              <UserRoundPen className="h-5 w-5 text-primary" />
              Edit profile
            </CardTitle>
            <CardDescription>Update your public profile details and workspace identity.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleProfileSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Photo URL</Label>
                <Input
                  id="avatarUrl"
                  name="avatarUrl"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="avatarFile">Upload photo</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Input id="avatarFile" type="file" accept="image/*" onChange={handleAvatarFileChange} className="max-w-md cursor-pointer file:mr-3 file:border-0 file:bg-transparent file:text-sm" />
                  <Button type="button" variant="outline" onClick={() => setAvatarUrl("")}>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Remove photo
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Upload a JPG, PNG, or WEBP image up to 2 MB.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  placeholder="Founder, Analyst, Product Manager"
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" placeholder="Your company or brand" value={company} onChange={(event) => setCompany(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Mumbai, India" value={location} onChange={(event) => setLocation(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bioPreview">Bio status</Label>
                <Input id="bioPreview" value={`${bio.length}/280 characters`} disabled readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell people a little about you, your work, or your financial goals."
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg" disabled={profileLoading}>
                {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {profileLoading ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.refresh()} disabled={profileLoading}>
                Cancel
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>

        <Card id="security" className="border-border bg-card/85 shadow-soft backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-2xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Change your login email and password securely.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSecuritySubmit}>
              <div className="space-y-2">
                <Label htmlFor="accountEmail">Email address</Label>
                <Input id="accountEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" name="currentPassword" type="password" placeholder="Current password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" name="newPassword" type="password" placeholder="New password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Confirm password" />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Leave the password fields empty if you only want to update your email address.</p>

              {securityError ? <p className="text-sm text-rose-600">{securityError}</p> : null}
              {securitySuccess ? <p className="text-sm text-emerald-600">{securitySuccess}</p> : null}

              <Button type="submit" disabled={securityLoading}>
                {securityLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {securityLoading ? "Updating..." : "Update security"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card id="preferences" className="border-border bg-card/85 shadow-soft backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-2xl">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              Preferences
            </CardTitle>
            <CardDescription>Manage your communication and product update preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePreferencesSubmit}>
              <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block font-medium">Email notifications</span>
                  <span className="text-sm text-muted-foreground">Receive important account and insight updates by email.</span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(event) => setWeeklyDigest(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block font-medium">Weekly digest</span>
                  <span className="text-sm text-muted-foreground">Get a weekly summary of activity, alerts, and progress.</span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <input
                  type="checkbox"
                  checked={productUpdates}
                  onChange={(event) => setProductUpdates(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block font-medium">Product updates</span>
                  <span className="text-sm text-muted-foreground">Hear about new features, improvements, and releases.</span>
                </span>
              </label>

              {preferencesError ? <p className="text-sm text-rose-600">{preferencesError}</p> : null}
              {preferencesSuccess ? <p className="text-sm text-emerald-600">{preferencesSuccess}</p> : null}

              <Button type="submit" disabled={preferencesLoading}>
                {preferencesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {preferencesLoading ? "Saving..." : "Save preferences"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
