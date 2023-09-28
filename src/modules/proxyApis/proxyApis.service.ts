/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  // Session,
  // Req,
} from '@nestjs/common';
// import { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import * as qs from 'qs';

// import { Request } from 'express'; // Import the Request object

import { ResponseService } from '../../common/utility/response/response.service';

@Injectable()
export class ProxyApisService {
  private tokenSabre: string | null = null;
  private tokenExpirationSabre: Date | null = null;
  private keySabre = 'VmpFNk5UVTFOVG8wTTBWRU9rRkI6YzNOM2NtVnpPVGs9';
  constructor(
    private readonly responseService: ResponseService,
    private readonly httpService: HttpService,
  ) {}

  // async logout() {}
  async callExternalAPI(payload: any) {
    payload;
    try {
      const tokenSabre = await this.getAuthTokenSabre();

      const responseSabre = await this.callSabreAPI(
        tokenSabre,
        payload.bargain,
      );
      const reValidate = await this.callReValidate(
        tokenSabre,
        payload.revalidate,
      );

      return { sabre: responseSabre, reValidate: reValidate }; // The data returned from the Sabre API
    } catch (error) {
      // return error;
      // Handle error
      // console.error('error', error);
      throw new Error('Error proxying to Sabre API');
    }
  }
  async reValidateApiProxy(payload: any) {
    payload;
    try {
      const tokenSabre = await this.getAuthTokenSabre();

      const reValidate = await this.callReValidate(tokenSabre, payload);

      return reValidate; // The data returned from the Sabre API
    } catch (error) {
      // return error;
      // Handle error
      // console.error('error', error);
      throw new Error('Error proxying to Sabre API');
    }
  }

  async callReValidate(tokenSabre: string, payload: any) {
    console.log('callReValidateApi');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenSabre}`,
    };
    const url = 'https://api.havail.sabre.com/v4.3.0/shop/flights/revalidate'; // Sabre API endpoint
    // return payload;
    try {
      const response = await this.httpService
        .post(url, payload, { headers })
        .toPromise();
      const result = response.data;
      // Start

      return result; // The data returned from the Sabre API
    } catch (error) {
      console.log('Error Sabre', error);
      throw new Error('Error in Sabre API');
    }
  }
  async getAuthTokenSabre() {
    if (
      this.tokenSabre &&
      this.tokenExpirationSabre &&
      this.tokenExpirationSabre > new Date()
    ) {
      return this.tokenSabre;
    }
    const headers = {
      Authorization: `Basic ${this.keySabre}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const url = 'https://api.havail.sabre.com/v2/auth/token';
    const data = qs.stringify({
      grant_type: 'client_credentials',
    });

    try {
      console.log('Getting New tokenSabre');
      const response = await this.httpService
        .post(url, data, { headers })
        .toPromise();
      this.tokenSabre = response.data.access_token;
      this.tokenExpirationSabre = new Date(
        new Date().getTime() + response.data.expires_in * 1000,
      );
      return this.tokenSabre;
    } catch (error) {
      console.log('tokenSabre Error');
      throw new Error(`Error getting auth tokenSabre: ${error.message}`);
    }
  }
  async callSabreAPI(tokenSabre: string, payload: any) {
    console.log('callSabreAPI');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenSabre}`,
    };
    const url = 'https://api.havail.sabre.com/v4/offers/shop'; // Sabre API endpoint
    // return payload;
    try {
      const response = await this.httpService
        .post(url, payload, { headers })
        .toPromise();
      const result = response.data;
      // Start

      const groupDescription =
        result.groupedItineraryResponse.itineraryGroups[0].groupDescription
          .legDescriptions;

      //Geting schedules
      const itinerGroup = result.groupedItineraryResponse.itineraryGroups.map(
        (item) =>
          item.itineraries.map((itinerary) =>
            itinerary.legs.map((leg) => leg.ref),
          ),
      );
      const legDes = result.groupedItineraryResponse.legDescs.map(
        (legDesc) => legDesc,
      );
      const scheduleDes = result.groupedItineraryResponse.scheduleDescs.map(
        (scheduleDesc) => scheduleDesc,
      );

      const pricingDetails =
        result.groupedItineraryResponse.itineraryGroups.flatMap((item) =>
          item.itineraries.flatMap((pricing) => pricing.pricingInformation),
        );
      const matchSchedule = itinerGroup.map((group) =>
        group.map((refs) =>
          refs.map((ref) => legDes.find((obj) => obj.id === ref)),
        ),
      );
      const matchLegsGet = matchSchedule.map((group1) =>
        group1.map((group2) =>
          group2.map((item) => item.schedules.map((item2) => item2.ref)),
        ),
      );

      const matchingData = matchLegsGet.map((group1) =>
        group1.map((group2) =>
          group2.map((refArray) =>
            refArray.flatMap((ref) =>
              scheduleDes.filter((schedule) => schedule.id === ref),
            ),
          ),
        ),
      );

      // This function is used to giving the name of array and index assign
      const modifiedData = matchingData.map((item) =>
        item.map((innerArray, index) => ({ schedualDetGet: innerArray })),
      );

      // Geting baggageAllowance
      const baggageref = pricingDetails.map((bag) =>
        bag.fare.passengerInfoList[0].passengerInfo.baggageInformation.map(
          (baggInfo) => baggInfo.allowance.ref,
        ),
      );
      const baggageval = result.groupedItineraryResponse.baggageAllowanceDescs;

      // Geting Seats
      const seatsAvailable = pricingDetails.map(
        (priceing) =>
          priceing.fare.passengerInfoList[0]?.passengerInfo.fareComponents?.flatMap(
            (fareC) =>
              fareC.segments?.flatMap(
                (segm) => segm.segment?.seatsAvailable || [],
              ) || [],
          ) || [],
      );

      // console.log(seatsAvailable);
      // Function to get values in proper format
      const getBaggageValues = (refArray) => {
        const descriptions = refArray.map((ref) => {
          const matchingItems = baggageval.filter((item) => item.id === ref);
          return matchingItems.length > 0 ? matchingItems[0] : null;
        });
        return descriptions;
      };

      // Use getBaggageValues function to get the values in proper format
      const baggageValues = baggageref.map((refArray) =>
        getBaggageValues(refArray),
      );

      // This function is used to remove the extra values
      const newPricingDetails = pricingDetails.map((item) => {
        const passengerInfoList = item.fare.passengerInfoList.map(
          (passenger) => {
            const {
              taxSummaries,
              taxes,
              currencyConversion,
              fareComponents,
              baggageInformation,
              passengerTotalFare,
              ...rest
            } = passenger.passengerInfo;
            return { passengerInfo: rest };
          },
        );

        return { ...item, fare: { ...item.fare, passengerInfoList } };
      });

      const updatedArray = modifiedData.flatMap((val, outerIndex) =>
        val.map((item, innerIndex) => {
          const pricingData = newPricingDetails[innerIndex];
          const baggageAllowance = baggageValues[innerIndex];
          const seatsAvailables = seatsAvailable[innerIndex];

          // Combine the item, pricingData, and baggageValues into a single object
          return {
            ...item,
            ...pricingData,
            groupDescription,
            baggageAllowance,
            seatsAvailables,
          };
        }),
      );

      // console.log('kashi', updatedArray);
      // End
      // return response.data; // The data returned from the Sabre API
      return updatedArray; // The data returned from the Sabre API
    } catch (error) {
      console.log('Error Sabre', error);
      throw new Error('Error in Sabre API');
    }
  }
}
