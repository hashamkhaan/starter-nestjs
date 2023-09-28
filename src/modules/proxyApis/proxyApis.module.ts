import { Module } from '@nestjs/common';
import { ProxyApisService } from './proxyApis.service';
import { ProxyApisController } from './proxyApis.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule], // Make sure UsersModule is imported here

  controllers: [ProxyApisController],
  providers: [ProxyApisService],
})
export class ProxyApisModule {}
