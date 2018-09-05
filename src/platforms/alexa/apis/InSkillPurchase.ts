import { RequestEnvelope, services } from "ask-sdk-model";
import * as _ from "lodash";
import * as rp from "request-promise";

import { ConnectionsSendRequest } from "../directives";

export class InSkillPurchase {
  public static buy(productId: string, token: string): ConnectionsSendRequest {
    const payload: any = {
      InSkillProduct: {
        productId,
      },
    };

    return new ConnectionsSendRequest("Buy", payload, token);
  }

  public static cancel(productId: string, token: string): ConnectionsSendRequest {
    const payload: any = {
      InSkillProduct: {
        productId,
      },
    };

    return new ConnectionsSendRequest("Cancel", payload, token);
  }

  public static upsell(productId: string, upsellMessage: string, token: string): ConnectionsSendRequest {
    const payload: any = {
      InSkillProduct: {
        productId,
      },
      upsellMessage,
    };

    return new ConnectionsSendRequest("Upsell", payload, token);
  }

  public rawEvent: RequestEnvelope; // the event as sent by the service

  constructor(event: RequestEnvelope) {
    this.rawEvent = _.cloneDeep(event);
  }

  public isAllowed() {
    const ALLOWED_ISP_ENDPOINTS = {
      "en-US": "https://api.amazonalexa.com",
    };

    const locale: string = this.rawEvent.request.locale;
    const endpoint: string = _.get(this.rawEvent, "context.System.apiEndpoint");

    return _.get(ALLOWED_ISP_ENDPOINTS, locale) === endpoint;
  }

  public async buyByReferenceName(referenceName: string, token: string): Promise<ConnectionsSendRequest> {
    const product: services.monetization.InSkillProduct | object =
      await this.getProductByReferenceName(referenceName);

    return InSkillPurchase.buy(_.get(product, "productId"), token);
  }

  public async cancelByReferenceName(referenceName: string, token: string): Promise<ConnectionsSendRequest> {
    const product: services.monetization.InSkillProduct | object =
      await this.getProductByReferenceName(referenceName);

    return InSkillPurchase.cancel(_.get(product, "productId"), token);
  }

  public async upsellByReferenceName(referenceName: string, upsellMessage: string, token: string): Promise<ConnectionsSendRequest> {
    const product: services.monetization.InSkillProduct | object =
      await this.getProductByReferenceName(referenceName);

    return InSkillPurchase.upsell(_.get(product, "productId"), upsellMessage, token);
  }

  public async getProductByReferenceName(referenceName: string): Promise<services.monetization.InSkillProduct | object> {
    const result: services.monetization.InSkillProductsResponse = await this.getProductList();

    return _.find(result.inSkillProducts, { referenceName }) || {};
  }

  public getProductList() {
    const { apiEndpoint, apiAccessToken } = this.rawEvent.context.System;

    const options: any = {
      headers: {
        "Accept-Language": this.rawEvent.request.locale,
        "Authorization": `Bearer ${apiAccessToken}`,
        "Content-Type": "application/json",
      },
      json: true,
      method: "GET",
      uri: `${apiEndpoint}/v1/users/~current/skills/~current/inSkillProducts`,
    };

    return rp(options);
  }
}