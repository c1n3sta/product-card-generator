import { z } from "zod";
import { publicProcedure, router } from "../server/_core/trpc";

export const authRouter = router({
  me: publicProcedure.query(async () => {
    // Return mock user data for local authentication
    return {
      user: {
        id: "local-user",
        name: "Local User",
        email: "user@example.com",
        role: "user"
      }
    };
  }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      // Simple authentication logic - accept any valid email/password
      // In a real app, you'd validate against your user database
      return {
        success: true,
        user: {
          id: "local-user",
          name: input.email.split("@")[0],
          email: input.email,
          role: "user"
        },
        token: "local-session-token"
      };
    }),

  logout: publicProcedure.mutation(async () => {
    // Simple logout - just return success
    return { success: true };
  }),
});