import { Module } from '@nestjs/common';
import { AuthClientService } from './services/auth-client.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
  providers: [AuthClientService, AuthGuard],
  exports: [AuthClientService, AuthGuard],
})
export class CommonModule {}
