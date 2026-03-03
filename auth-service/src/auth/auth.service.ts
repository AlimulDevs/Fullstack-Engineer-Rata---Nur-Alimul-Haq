import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponse, ValidateTokenResponse } from './models/auth-response.model';
import { UserModel } from './models/user.model';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
      },
    });

    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: this.toUserModel(user),
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: this.toUserModel(user),
    };
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        return { isValid: false };
      }

      return {
        isValid: true,
        user: this.toUserModel(user),
      };
    } catch {
      return { isValid: false };
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    );
  }

  private toUserModel(user: {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserModel {
    const model = new UserModel();
    model.id = user.id;
    model.email = user.email;
    model.createdAt = user.createdAt;
    model.updatedAt = user.updatedAt;
    return model;
  }
}
