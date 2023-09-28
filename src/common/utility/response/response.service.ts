import { Injectable, HttpStatus, Global } from '@nestjs/common';

@Injectable()
@Global() // Add this decorator to make the service global
export class ResponseService {
  createResponse(status: HttpStatus, responseData: any, message: string): any {
    const statusMap = {
      [HttpStatus.OK]: {
        status: 'SUCCESS',
        code: HttpStatus.OK,
      },
      [HttpStatus.BAD_REQUEST]: {
        status: 'BAD REQUEST',
        code: HttpStatus.BAD_REQUEST,
      },
      [HttpStatus.UNAUTHORIZED]: {
        status: 'UNAUTHORIZED',
        code: HttpStatus.UNAUTHORIZED,
      },
      // Add more status codes as needed
    };

    const responseObj: any = {
      message,
      ...(statusMap[status] || {
        status: 'INTERNAL SERVER ERROR',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
      }),
    };

    if (responseData !== null) {
      responseObj.payload = responseData;
    }

    return responseObj;
  }
}
