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
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  RegisterOrganisationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("register-organisation")
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerOrganisation(@Body() dto: RegisterOrganisationDto) {
    return this.authService.registerOrganisation(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body("email") email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  async refresh(@Request() req, @Body("refresh_token") refreshToken: string) {
    return this.authService.refreshToken(req.user.id, refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req, @Body("refresh_token") refreshToken: string) {
    return this.authService.logout(req.user.id, refreshToken);
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getActiveSessions(@Request() req) {
    return this.authService.getActiveSessions(req.user.id);
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  async revokeSession(@Request() req, @Param("sessionId") sessionId: string) {
    return this.authService.revokeSession(req.user.id, sessionId);
  }
}
