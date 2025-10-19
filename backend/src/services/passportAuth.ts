// passportSetup.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as TwitchStrategy } from "passport-twitch-new";
import { userModel, type IUser } from "../models/user.js";

// Google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        let user = await userModel.findOne({ email });

        if (!user) {
          user = await userModel.create({
            email,
            username: profile.displayName,
            avatar: profile.photos?.[0].value,
            googleId: profile.id,
            isVerified: true,
          });
        } else {
          // return if user exists
          return;
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    },
  ),
);

// Twitch
passport.use(
  new TwitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
      callbackURL: "/auth/twitch/callback",
      scope: ["user:read:email"], // adjust scopes as needed
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findOne({ twitchId: profile.id });

        if (!user) {
          user = await userModel.create({
            twitchId: profile.id,
            username: profile.display_name,
            email: profile.email,
            avatar: profile.profile_image_url,
            twitchAccessToken: accessToken,
            isVerified: true,
          });
        } else {
          user.twitchAccessToken = accessToken;
          await user.save();
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    },
  ),
);

passport.serializeUser((user: IUser, done) => done(null, user._id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
