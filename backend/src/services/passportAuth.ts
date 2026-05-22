import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from "passport-google-oauth20";
import { pfpDefaults, pickRandom, userModel } from "../models/user";

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
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (
        _: string, // for access and refresh tokens by google
        __: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          console.log("callback triggered!");
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
              avatar: {
                value: pickRandom(pfpDefaults),
                isCloud: false,
              },

              googleId: profile.id,
              isVerified: true,
            });
          }
          done(null, user);
        } catch (err) {
          done(err);
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
}
