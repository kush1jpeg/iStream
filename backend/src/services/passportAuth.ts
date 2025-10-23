// passportSetup.ts
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as TwitchStrategy } from "passport-twitch-new";
import { userModel, type IUser } from "../models/user.js";
import passport, { type Profile } from "passport";
import type { VerifyCallback } from "jsonwebtoken";

export function initPassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing Google OAuth env variables!");
  }
  // if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
  //   throw new Error("Missing Twitch OAuth env variables!");
  // }
  // Google
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "http://localhost:4000/api/auth/login/google/callback",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          console.log("✅ Callback triggered!");
          if (!profile) {
            // Fail fast
            throw new Error(
              "Google profile is missing. Cannot continue authentication.",
            );
          }
          if (!profile.emails || !profile.photos) {
            throw new Error(
              "Google profile has no emails. Cannot continue authentication.",
            );
          }
          const email = profile.emails?.[0]?.value;
          let user = await userModel.findOne({ email });
          if (!user) {
            user = await userModel.create({
              email,
              username: profile.displayName,
              avatar: profile.photos[0],
              googleId: profile.id,
              isVerified: true,
              googleAccessToken: accessToken,
            });
          } else {
            user.googleAccessToken = accessToken;
            // return if user exists
          }

          done(null, user);
        } catch (err) {
          done(err, null);
        }
      },
    ),
  );

  // Twitch
  // passport.use(
  //   new TwitchStrategy(
  //     {
  //       clientID: process.env.TWITCH_CLIENT_ID!,
  //       clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  //       callbackURL: "/auth/twitch/callback",
  //       scope: ["user:read:email"], // adjust scopes as needed
  //     },
  //     async (accessToken, refreshToken, profile, done) => {
  //       try {
  //         let user = await userModel.findOne({ twitchId: profile.id });
  //
  //         if (!user) {
  //           user = await userModel.create({
  //             twitchId: profile.id,
  //             username: profile.display_name,
  //             email: profile.email,
  //             avatar: profile.profile_image_url,
  //             twitchAccessToken: accessToken,
  //             isVerified: true,
  //           });
  //         } else {
  //           user.twitchAccessToken = accessToken;
  //           await user.save();
  //         }
  //
  //         done(null, user);
  //       } catch (err) {
  //         done(err, null);
  //       }
  //     },
  //   ),
  // );

  passport.serializeUser((user: IUser, done) => done(null, user._id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await userModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
  return passport;
}
