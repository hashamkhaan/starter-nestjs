import { Controller, Body, Get, Session, Post } from '@nestjs/common';

import { ResponseService } from '../../common/utility/response/response.service';

import { SkipAuth } from '../../common/decorators/skip-auth.decorator';
import { ProxyApisService } from './proxyApis.service';

@Controller('proxyApi')
export class ProxyApisController {
  constructor(
    private readonly proxyApisService: ProxyApisService,

    private readonly responseService: ResponseService,
  ) {}

  @Get('getAuthSession')
  async getAuthSession(@Session() session: Record<string, any>) {
    // console.log('session Authenticated', session.authenticated);
    // console.log('session sid', session.id);
    return { id: session.id, session };
  }

  // @UseGuards(AuthGuard, RolesGuard)
  @Get('callExternalAPI')
  @SkipAuth()
  async callExternalAPI(@Body() payload: any) {
    return this.proxyApisService.callExternalAPI(payload);
  }
  @Post('reValidateApiProxy')
  @SkipAuth()
  async reValidateApiProxy(@Body() payload: any) {
    return this.proxyApisService.reValidateApiProxy(payload);
  }
}
