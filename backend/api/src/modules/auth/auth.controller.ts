import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Ip,
  Headers,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { Throttle } from "@nestjs/throttler";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiBody,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  RegisterOrganisationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  AcceptInviteDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  setAuthCookies,
  clearAuthCookies,
  readCookie,
  REFRESH_TOKEN_COOKIE,
} from "../../common/config/auth-cookies";

/**
 * Mirrors an auth result into httpOnly cookies when it carries tokens.
 *
 * The tokens stay in the JSON body as well. Removing them would break every
 * non-browser consumer in one step, and the browser client simply stops reading
 * them — see `frontend/web/lib/api-client.ts`.
 */
function issueCookies(res: Response, result: any) {
  if (result?.access_token && result?.refresh_token) {
    setAuthCookies(res, result);
  }
  return result;
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("register-organisation")
  @ApiOperation({ summary: "Register a new organisation and its admin" })
  @ApiResponse({
    status: 201,
    description: "Organisation and admin successfully registered",
  })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerOrganisation(
    @Body() dto: RegisterOrganisationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return issueCookies(res, await this.authService.registerOrganisation(dto));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiHeader({
    name: "user-agent",
    description: "Browser/Client user agent string",
    required: false,
  })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return issueCookies(
      res,
      await this.authService.login(loginDto, ipAddress, userAgent),
    );
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset link" })
  @ApiResponse({ status: 200, description: "Reset email sent if user exists" })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password using token" })
  @ApiResponse({ status: 200, description: "Password successfully reset" })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email using token" })
  @ApiResponse({ status: 200, description: "Email successfully verified" })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post("accept-invite")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accept an invitation and set a password" })
  @ApiResponse({ status: 200, description: "Invitation accepted, logged in" })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }

  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend email verification link" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { email: { type: "string", example: "user@example.com" } },
    },
  })
  async resendVerification(@Body("email") email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Return current user profile" })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Refresh access token" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        refresh_token: { type: "string", example: "eyJhbGciOiJIUzI1..." },
      },
    },
  })
  async refresh(
    @Request() req,
    @Body("refresh_token") refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Body first so existing non-browser callers are unaffected; the cookie is
    // the fallback for the browser client, which can no longer read the token.
    const token = refreshToken || readCookie(req, REFRESH_TOKEN_COOKIE);
    // Rotation issues a new refresh token, so the cookies must be replaced too
    // — otherwise the browser keeps presenting the one just revoked.
    return issueCookies(
      res,
      await this.authService.refreshToken(req.user.id, token),
    );
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout user and revoke refresh token" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        refresh_token: { type: "string", example: "eyJhbGciOiJIUzI1..." },
      },
    },
  })
  async logout(
    @Request() req,
    @Body("refresh_token") refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = refreshToken || readCookie(req, REFRESH_TOKEN_COOKIE);
    // Cleared even if revocation throws — leaving a live cookie on a failed
    // logout is the worse outcome of the two.
    try {
      return await this.authService.logout(req.user.id, token);
    } finally {
      clearAuthCookies(res);
    }
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all active sessions for the current user" })
  async getActiveSessions(@Request() req) {
    return this.authService.getActiveSessions(req.user.id);
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke a specific session" })
  async revokeSession(@Request() req, @Param("sessionId") sessionId: string) {
    return this.authService.revokeSession(req.user.id, sessionId);
  }
}
