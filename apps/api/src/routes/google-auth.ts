import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { prisma } from "../db.js";
import { ApiResponse } from "../types.js";
import { env } from "../env.js";

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET
);

const getGoogleConfig = async () => {
  try {
    let config;
    try {
      config = await prisma.googleAuthConfig.findUnique({
        where: { id: "google-auth-config" },
      });
    } catch (dbError) {
      console.error("Database query error:", dbError);
      throw dbError;
    }

    return {
      clientId: config?.clientId || env.GOOGLE_CLIENT_ID,
      clientSecret: config?.clientSecret || env.GOOGLE_CLIENT_SECRET,
      redirectUri:
        config?.redirectUri ||
        env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3000/auth/google/callback",
      enabled: config?.enabled ?? false,
    };
  } catch (error) {
    console.error("getGoogleConfig error:", error);
    throw error;
  }
};

const GoogleAuthTokenSchema = z.object({
  token: z.string().optional(),
  code: z.string().optional(),
}).refine((data) => data.token || data.code, {
  message: "Token or code is required",
});

// Test endpoint to verify endpoint is working
export default async function googleAuthRoutes(fastify: FastifyInstance) {
  // Simple test endpoint
  fastify.get("/auth/test", async (request, reply) => {
    return reply.send({ ok: true, message: "API is working" });
  });

  // Get Google Auth URL for frontend
  fastify.get("/auth/google/url", async (request, reply) => {
    try {
      // First, log that we received the request
      console.log("DEBUG: /auth/google/url endpoint called");
      fastify.log.info("DEBUG: /auth/google/url endpoint called");

      // Try to get the config  
      console.log("DEBUG: Calling getGoogleConfig()...");
      let googleConfig;
      try {
        googleConfig = await getGoogleConfig();
        console.log("DEBUG: googleConfig result:", {
          clientIdExists: !!googleConfig.clientId,
          enabled: googleConfig.enabled
        });
      } catch (configErr) {
        console.error("DEBUG: Error in getGoogleConfig:", configErr);
        throw configErr;
      }
      
      if (!googleConfig.clientId || !googleConfig.enabled) {
        console.log("DEBUG: Missing clientId or not enabled");
        return reply.code(503).send({
          ok: false,
          message: "Google OAuth not configured",
        } as ApiResponse);
      }

      const redirectUrl = googleConfig.redirectUri;
      const scopes = [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ];

      console.log("DEBUG: Creating OAuth2Client...");
      const client = new OAuth2Client(
        googleConfig.clientId,
        googleConfig.clientSecret,
        redirectUrl
      );

      console.log("DEBUG: Generating auth URL...");
      const url = client.generateAuthUrl({
        client_id: googleConfig.clientId,
        redirect_uri: redirectUrl,
        access_type: "online",
        scope: scopes,
      });
      
      console.log("DEBUG: Successfully generated URL, length:", url.length);

      return reply.send({
        ok: true,
        data: { url },
      } as ApiResponse);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("DEBUG: Caught error:", errorMsg);
      console.error("DEBUG: Full error:", err);
      
      fastify.log.error({ message: errorMsg }, "Error in /auth/google/url");
      return reply.code(500).send({
        ok: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  });

  // Handle Google OAuth callback
  fastify.post<{ Body: z.infer<typeof GoogleAuthTokenSchema> }>(
    "/auth/google/callback",
    async (request, reply) => {
      try {
        const body = GoogleAuthTokenSchema.parse(request.body);

        let googleProfile: any;
        let accessToken = body.token;

        if (body.code) {
          const googleConfig = await getGoogleConfig();
          if (!googleConfig.clientId || !googleConfig.clientSecret || !googleConfig.enabled) {
            return reply.code(503).send({
              ok: false,
              message: "Google OAuth not configured",
            } as ApiResponse);
          }

          const redirectUrl = googleConfig.redirectUri;

          googleClient.setCredentials({
            access_token: undefined,
          });

          try {
            const exchangeClient = new OAuth2Client(
              googleConfig.clientId,
              googleConfig.clientSecret,
              redirectUrl
            );

            const { tokens } = await exchangeClient.getToken({
              code: body.code,
              redirect_uri: redirectUrl,
            });
            accessToken = tokens.access_token || undefined;
          } catch (err) {
            fastify.log.error({ err }, "Failed to exchange Google code");
            return reply.code(401).send({
              ok: false,
              message: "Invalid Google code",
            } as ApiResponse);
          }
        }

        if (!accessToken) {
          return reply.code(400).send({
            ok: false,
            message: "Token is required",
          } as ApiResponse);
        }

        try {
          const response = await axios.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          googleProfile = response.data;
        } catch (err) {
          fastify.log.error({ err }, "Failed to fetch Google profile");
          return reply.code(401).send({
            ok: false,
            message: "Invalid Google token",
          } as ApiResponse);
        }

        const googleId = googleProfile.id;
        const googleEmail = googleProfile.email;
        const googleName = googleProfile.name;
        const googleProfilePicture = googleProfile.picture;

        // Check if user with this Google ID exists
        let user = await prisma.user.findUnique({
          where: { googleId },
        } as any);

        if (!user) {
          // Check if user with this email exists
          const existingUser = await prisma.user.findUnique({
            where: { email: googleEmail },
          });

          if (existingUser) {
            // Link Google account to existing user
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId,
                googleEmail,
                googleName,
                googleProfilePicture,
                googleAuthProvider: "google",
              } as any,
            });
          } else {
            // Create new user with Google account
            // Find or create tenant
            const tenant = await prisma.tenant.create({
              data: {
                name: `${googleName}'s Workspace`,
              },
            });

            user = await prisma.user.create({
              data: {
                tenantId: tenant.id,
                email: googleEmail,
                name: googleName,
                googleId,
                googleEmail,
                googleName,
                googleProfilePicture,
                googleAuthProvider: "google",
              } as any,
            });
          }
        } else if (
          !user.googleProfilePicture ||
          user.googleProfilePicture !== googleProfilePicture
        ) {
          // Update profile picture if changed
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleProfilePicture,
              googleName,
            },
          });
        }

        // Generate JWT
        const token = fastify.jwt.sign(
          { userId: user.id, tenantId: user.tenantId, email: user.email },
          { expiresIn: "7d" }
        );

        fastify.log.info(
          { userId: user.id, googleId },
          "User authenticated with Google"
        );

        return reply.send({
          ok: true,
          message: "Google authentication successful",
          data: {
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              username: (user as any).username,
              avatar: user.avatar || googleProfilePicture,
            },
          },
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }

        fastify.log.error({ err }, "Google authentication error");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );
}
